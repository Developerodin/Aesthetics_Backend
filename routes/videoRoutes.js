import express from 'express';
import { uploadVideo , getAllData, getById, deleteById } from '../controllers/videoController.js';  

const router = express.Router();


router.post('/upload', uploadVideo);
router.get('/', getAllData);
router.get('/:id', getById);
router.delete('/:id', deleteById);


export default router;
