// routes/audioRecordingRoutes.js
import express from 'express';
import upload from '../config/upload.js'; // Import the multer upload middleware
import { uploadAudio } from '../controllers/audioRecordingController.js'; // Import the controller

const router = express.Router();

// POST endpoint for uploading audio files
router.post('/upload', upload.single('audioFile'), uploadAudio);

export default router;
