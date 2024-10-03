import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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

// Function to download the .m3u8 file
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
const uploadVideo = async (req, res) => {
  try {
    const { fileName } = req.body;

    // Step 1: Process the M3U8 file and download .ts chunks
    let tsFiles;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        tsFiles = await processM3U8(fileName);
        break; // If successful, exit the loop
      } catch (error) {
        console.error(`Error processing M3U8 (attempt ${retryCount + 1}):`, error);

        if (error.response && error.response.status === 403) {
          const errorBody = error.response.data.toString(); // Convert to string if it's not already
          if (errorBody.includes('Request has expired')) {
            console.log('Pre-signed URL expired, regenerating...');
            await getPresignedUrl(fileName); // Regenerate the pre-signed URL
            retryCount++;
            continue; // Retry the loop
          }
        }
        
        throw error; // If it's not an expired request error, throw it
      }
    }

    if (!tsFiles) {
      throw new Error('Failed to process M3U8 file after multiple attempts');
    }

    console.log('Successfully processed M3U8 file. Number of TS files:', tsFiles.length);

    // Step 2: Merge the .ts chunks and extract audio
    const audioBuffer = await mergeAndExtractAudio(tsFiles, fileName);

    // Step 3: Convert audio to text using Google Gemini
    const transcription = await convertAudioToTextGemini(audioBuffer, fileName);

    // Step 4: Save transcription to 'transcriptions' folder
    const transcriptionFolder = path.join(__dirname, '../transcriptions');
    if (!fs.existsSync(transcriptionFolder)) {
      fs.mkdirSync(transcriptionFolder);
    }

    const transcriptionFilePath = path.join(
      transcriptionFolder,
      `${path.basename(fileName, path.extname(fileName))}.txt`
    );
    fs.writeFileSync(transcriptionFilePath, transcription, 'utf8'); 

    // Step 5: Send response with transcription path
    res.status(201).json({
      message: 'Video downloaded, audio extracted, and transcription generated successfully',
      transcriptionFilePath,
      transcription,
    });

    // Clean up .ts files after processing
    tsFiles.forEach(file => fs.unlinkSync(file));

    // Step 6: Delete the audio file after transcription
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


export  {uploadVideo};
