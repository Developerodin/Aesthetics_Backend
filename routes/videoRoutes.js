import express from 'express';
import { uploadVideo , getAllData, getById, deleteById , getLatestTranscription} from '../controllers/videoController.js';  

const router = express.Router();


router.post('/upload', uploadVideo);
router.get('/', getAllData);
router.get('/latest', getLatestTranscription);
router.get('/:id', getById);
router.delete('/:id', deleteById);


export default router;
