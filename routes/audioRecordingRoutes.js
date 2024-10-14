// routes/audioRecordingRoutes.js
import express from 'express';
import upload from '../config/upload.js'; // Import the multer upload middleware
import { uploadAndSplitAudio ,getAudioChunks} from '../controllers/audioRecordingController.js'; // Import the controller
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST endpoint for uploading audio files
router.post('/upload', upload.single('audioFile'), uploadAndSplitAudio);
router.get('/chunks/:id',getAudioChunks);

router.get('/get/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
  
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Send the audio file as a response
      res.sendFile(filePath);
    });
  });

export default router;
