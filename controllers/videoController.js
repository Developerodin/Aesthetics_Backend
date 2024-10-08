import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Transcription from '../models/transcriptionModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2'
});

const s3 = new AWS.S3();

// Function to generate the S3 pre-signed URL for .m3u8 and .ts files
const getPresignedUrl = async (fileName) => {
  console.log('getPresignedUrl called with fileName:', fileName);
  if (!fileName) {
    console.error('Error: Missing fileName for generating presigned URL');
    throw new Error('Missing fileName for generating presigned URL');
  }

  const params = {
    Bucket: 'agora-rn',
    Key: fileName,
    Expires: 600
  };

  console.log('S3 params:', params);

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    console.log('Presigned URL generated:', url);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

// Function to download the .m3u8  
const downloadM3U8File = async (fileName, outputLocationPath) => {
  const presignedUrl = await getPresignedUrl(fileName);
  const writer = fs.createWriteStream(outputLocationPath);

  const response = await axios({
    url: presignedUrl,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// Function to download the .ts files
const downloadTSFile = async (url, outputLocationPath) => {
  const writer = fs.createWriteStream(outputLocationPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// Function to generate pre-signed URL for TS files
const getPresignedTsUrl = async (tsFileName) => {
  console.log('getPresignedTsUrl called with tsFileName:', tsFileName);

  const params = {
    Bucket: 'agora-rn',
    Key: tsFileName,
    Expires: 600
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    console.log('Presigned URL for TS file generated:', url);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL for TS file:', error);
    throw error;
  }
};

// Function to process the M3U8 file and download TS files
const processM3U8 = async (fileName) => {
  const m3u8FilePath = path.join(__dirname, '../temp', fileName);
  await downloadM3U8File(fileName, m3u8FilePath);

  const m3u8Content = fs.readFileSync(m3u8FilePath, 'utf8');
  const lines = m3u8Content.split('\n');

  const tsFiles = [];
  for (let line of lines) {
    if (line.endsWith('.ts')) {
      const tsFileName = line.trim(); // Get the .ts file name from the m3u8 content

      // Step 1: Generate presigned URL for each TS file
      const presignedTsUrl = await getPresignedTsUrl(tsFileName);

      // Step 2: Download the TS file using the presigned URL
      const tsFilePath = path.join(__dirname, '../temp', tsFileName);
      await downloadTSFile(presignedTsUrl, tsFilePath);
      tsFiles.push(tsFilePath);
    }
  }

  // Cleanup the downloaded M3U8 file after processing
  fs.unlinkSync(m3u8FilePath);

  return tsFiles;
};

// Function to merge the .ts files and extract audio
const mergeAndExtractAudio = async (tsFiles, fileName) => {
  return new Promise((resolve, reject) => {
    const mergedVideoPath = path.join(__dirname, '../uploads', `${fileName}.mp4`);

    // Use FFmpeg to concatenate the .ts files and extract audio
    ffmpeg()
      .input(`concat:${tsFiles.join('|')}`) // Merge the .ts files
      .outputOptions('-c copy')
      .save(mergedVideoPath)
      .on('end', () => {
        console.log('Merged video created:', mergedVideoPath);

        // Extract audio from the merged video
        const audioPath = path.join(__dirname, '../uploads', `${fileName}.mp3`);
        ffmpeg(mergedVideoPath)
          .toFormat('mp3')
          .on('end', () => {
            console.log('Audio extraction completed:', audioPath);
            resolve(fs.readFileSync(audioPath)); // Read the extracted audio
            fs.unlinkSync(mergedVideoPath); // Delete the merged video
          })
          .on('error', (error) => {
            console.error('Error during audio extraction:', error);
            reject(error);
          })
          .save(audioPath);
      })
      .on('error', (error) => {
        console.error('Error merging .ts files:', error);
        reject(error);
      });
  });
};

// Function to convert audio to text using Google Gemini
const convertAudioToTextGemini = async (audioBuffer, fileName) => {
  const audio = {
    inlineData: {
      data: Buffer.from(audioBuffer).toString("base64"),
      mimeType: 'audio/mpeg',
    },
  };
  const prompt = "Extract text from this audio.";

  try {
    const result = await model.generateContent([audio, prompt]);
    return result.response.text();
  } catch (error) {
    console.error("Error during transcription with Google Gemini:", error);
    throw error;
  }
};

// Main function to handle the upload and process the video
const uploadVideo = async (req, res, sid,dataid) => {
  try {
    const { fileName } = req.body;

    // Step 1: Process the M3U8 file and download .ts chunks
    let tsFiles;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        tsFiles = await processM3U8(fileName);
        break;
      } catch (error) {
        console.error(`Error processing M3U8 (attempt ${retryCount + 1}):`, error);

        if (error.response && error.response.status === 403) {
          const errorBody = error.response.data.toString();
          if (errorBody.includes('Request has expired')) {
            console.log('Pre-signed URL expired, regenerating...');
            await getPresignedUrl(fileName);
            retryCount++;
            continue;
          }
        }

        throw error;
      }
    }

    if (!tsFiles) {
      throw new Error('Failed to process M3U8 file after multiple attempts');
    }

    console.log('Successfully processed M3U8 file. Number of TS files:', tsFiles.length);

    // Step 2: Merge the .ts chunks and extract audio
    const audioBuffer = await mergeAndExtractAudio(tsFiles, fileName);

    // Step 3: Convert audio to text using Google Gemini
    console.log('Starting audio to text conversion using Google Gemini...');
const transcription = await convertAudioToTextGemini(audioBuffer, fileName);
console.log('Audio to text conversion completed:', transcription);

    // Step 4: Create new transcription and save with sid
    const newTranscription = new Transcription({
      text: transcription,
      sid: sid,
      dataid:dataid,  // Add sid to transcription
    });
    await newTranscription.save();

    // Step 5: Send response with transcription
    res.status(201).json({
      message: 'Video downloaded, audio extracted, and transcription generated successfully',
      transcription: newTranscription,
    });

    tsFiles.forEach(file => fs.unlinkSync(file));

    // Step 6: Delete audio file after transcription
    const audioFilePath = path.join(__dirname, '../uploads', `${fileName}.mp3`);
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
      console.log('Audio file deleted:', audioFilePath);
    } else {
      console.log('Audio file not found for deletion:', audioFilePath);
    }

  } catch (error) {
    console.error('Error uploading or processing video:', error);
    res.status(500).json({ error: 'Failed to upload and process video' });
  }
};


// Function to get all transcriptions
const getAllData = async (req, res) => {
  try {
    const transcriptions = await Transcription.find();
    res.status(200).json(transcriptions);
  } catch (error) {
    console.error('Error fetching all transcriptions:', error);
    res.status(500).json({ error: 'Failed to fetch transcriptions' });
  }
};

// Function to get a transcription by ID
const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const transcription = await Transcription.findById(id);
    if (!transcription) {
      return res.status(404).json({ message: 'Transcription not found' });
    }
    res.status(200).json(transcription);
  } catch (error) {
    console.error('Error fetching transcription by ID:', error);
    res.status(500).json({ error: 'Failed to fetch transcription' });
  }
};

// Function to delete a transcription by ID
const deleteById = async (req, res) => {
  const { id } = req.params;

  try {
    const transcription = await Transcription.findByIdAndDelete(id);
    if (!transcription) {
      return res.status(404).json({ message: 'Transcription not found' });
    }
    res.status(200).json({ message: 'Transcription deleted successfully' });
  } catch (error) {
    console.error('Error deleting transcription by ID:', error);
    res.status(500).json({ error: 'Failed to delete transcription' });
  }
};

const getLatestTranscription = async (req, res) => {
  try {
    // Find the latest transcription by sorting `createdAt` in descending order
    const latestTranscription = await Transcription.findOne().sort({ createdAt: -1 });

    if (!latestTranscription) {
      return res.status(404).json({ message: 'No transcription found' });
    }

    // Return the latest transcription
    res.status(200).json(latestTranscription);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching latest transcription', error: err.message });
  }
};


export  {uploadVideo ,getAllData ,getById ,deleteById ,getLatestTranscription} ;
