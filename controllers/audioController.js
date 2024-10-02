import dotenv from 'dotenv';
import fs from 'fs';
import mime from 'mime-types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Audio from '../models/Audio.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const convertAudioToTextGemini = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File or File path is missing!');
    }

    const file = fs.readFileSync(filePath);
    const audio = {
      inlineData: {
        data: Buffer.from(file).toString('base64'),
        mimeType: mime.lookup(filePath),
      },
    };
    const prompt = 'Extract text from this audio.';

    const result = await model.generateContent([audio, prompt]);
    const transcription = result.response.text();

    console.log('Transcription:', transcription);
    return transcription;
  } catch (error) {
    console.error('Error during transcription with Google Gemini:', error);
    throw error;
  }
};

const uploadAudio = async (req, res) => {
  try {
    const { path, originalname } = req.file;

    // Convert audio file to text using Google Gemini
    const transcription = await convertAudioToTextGemini(path);

    // Save transcription to a text file
    const textFilePath = `./transcriptions/${originalname}.txt`;
    fs.writeFileSync(textFilePath, transcription, 'utf8');

    const audio = new Audio({
      originalName: originalname,
      filePath: path,
      transcription: transcription,
      transcriptionFilePath: textFilePath,
    });

    await audio.save();

    res.status(201).json({
      message: 'File uploaded and transcribed successfully',
      file: audio,
    });
  } catch (error) {
    console.error('Error uploading or processing audio:', error);
    res.status(500).json({ error: 'Failed to upload or process audio' });
  }
};

export { uploadAudio };