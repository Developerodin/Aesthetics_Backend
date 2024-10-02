import express from 'express';
import { uploadVideo } from '../controllers/videoController.js';  // Import your controller function

const router = express.Router();

// Define the POST route for uploading and processing the video
router.post('/upload', uploadVideo);

export default router;
