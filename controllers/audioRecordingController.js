import AudioRecording from '../models/audioRecordingModel.js';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import mime from "mime-types";
import dotenv from "dotenv";

dotenv.config();

// Recreate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Function to convert audio chunk to text using Google Gemini
const convertAudioToTextGemini = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("File or File path is missing!");
    }

    const file = fs.readFileSync(filePath);
    const audio = {
      inlineData: {
        data: Buffer.from(file).toString("base64"),
        mimeType: mime.lookup(filePath),
      },
    };
    const prompt = "Extract text from this audio.";

    const result = await model.generateContent([audio, prompt]);
    const transcription = result.response.text();

    return transcription; // Return the transcription
  } catch (error) {
    console.error("Error during transcription with Google Gemini:", error);
    throw error; // Throw error for handling in the main function
  }
};

// Controller for uploading and splitting the audio into chunks
export const uploadAndSplitAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const destinationFolder = path.join(__dirname, '../uploads/split_chunks');

    // Ensure the destination folder exists
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    // Initialize the recording object
    const newRecording = new AudioRecording({
      originalFilePath: filePath,
      chunks: [],
    });

    // Split the audio into 10-second chunks and save the paths and timestamps
    ffmpeg(filePath)
      .outputOptions([
        '-f segment',
        '-segment_time 10', // Split the file into 10-second segments
        '-c copy',
      ])
      .on('end', async () => {
        console.log('Audio file split into chunks successfully');

        // After splitting, read the files and save each chunk with timestamps
        const files = fs.readdirSync(destinationFolder);

        // Process each chunk sequentially
        for (const file of files) {
          const startTime = newRecording.chunks.length * 10; // Start time of the chunk in seconds
          const endTime = startTime + 10; // End time of the chunk in seconds

          const chunkFilePath = path.join(destinationFolder, file);
          const transcription = await convertAudioToTextGemini(chunkFilePath); // Process chunk

          newRecording.chunks.push({
            filePath: chunkFilePath,
            startTime,
            endTime,
            transcription, // Store the transcription
          });
        }

        // Save the recording along with the chunk details to the database
        await newRecording.save();

        res.status(200).json({
          message: 'Audio uploaded and split into chunks successfully',
          recordingId: newRecording._id,
          chunks: newRecording.chunks,
        });
      })
      .on('error', (err) => {
        console.error('Error splitting audio file:', err);
        res.status(500).json({ message: 'Error splitting audio file' });
      })
      .save(`${destinationFolder}/chunk_%03d.wav`); // Saves as chunk_001.wav, chunk_002.wav, etc.
  } catch (error) {
    console.error('Error processing audio upload:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Controller to get audio chunks by recording ID
export const getAudioChunks = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await AudioRecording.findById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.status(200).json({
      chunks: recording.chunks,
    });
  } catch (error) {
    console.error('Error retrieving audio chunks:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getTranscriptions = async (req, res) => {
  try {
    const { id } = req.params; // Get recording ID from the request parameters

    // Find the audio recording by ID
    const recording = await AudioRecording.findById(id);
    
    // Check if the recording exists
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Extract transcriptions from the chunks
    const transcriptions = recording.chunks.map(chunk => ({
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      transcription: chunk.transcription,
    }));

    // Return the transcriptions
    res.status(200).json({
      transcriptions,
    });
  } catch (error) {
    console.error('Error retrieving transcriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
