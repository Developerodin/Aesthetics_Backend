import express from 'express';
import multer from 'multer';
import { uploadAudio } from '../controllers/audioController.js';

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), uploadAudio);

export default router;