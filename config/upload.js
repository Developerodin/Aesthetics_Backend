// config/upload.js
import multer from 'multer';
import path from 'path';

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Specify the directory to save the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
  },
});

// Initialize multer with the defined storage
const upload = multer({ storage });

export default upload;
