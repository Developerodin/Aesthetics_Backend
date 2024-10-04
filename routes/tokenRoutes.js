// routes/tokenRoutes.js
import express from 'express';
import { generateAndSaveToken, getTokenAndChannelName, updateChannelNameAndToken } from '../controllers/tokenController.js';

const router = express.Router();

// Route to generate and save token
router.post('/', generateAndSaveToken);

// Route to get token and channel name
router.get('/', getTokenAndChannelName);

// Route to update channel name and regenerate token
router.post('/update', updateChannelNameAndToken);

export default router;
