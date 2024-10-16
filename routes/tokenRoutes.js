// routes/tokenRoutes.js
import express from 'express';
import { updateAllTokens, getTokensByChannelName,getLatestToken } from '../controllers/tokenController.js';


const router = express.Router();

// Route to generate and save token
router.post('/', getTokensByChannelName);

// Route to get token and channel name
router.get('/', getLatestToken);

// Route to update channel name and regenerate token
router.post('/update', updateAllTokens);

export default router;
