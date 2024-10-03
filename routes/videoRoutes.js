import express from 'express';
import { uploadVideo , getAllData, getById, deleteById } from '../controllers/videoController.js';  // Import your controller function

const router = express.Router();

// Define the POST route for uploading and processing the video
router.post('/upload', uploadVideo);
router.get('/', getAllData);
router.get('/:id', getById);
router.delete('/:id', deleteById);


export default router;
