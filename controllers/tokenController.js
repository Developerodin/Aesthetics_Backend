// controllers/tokenController.js
import pkg from 'agora-access-token';
import Token from '../models/Token.js';

const { RtcRole, RtcTokenBuilder } = pkg;

const APP_ID = '95ee23773c964b6baf93d16dbfcb3fe4';
const APP_CERTIFICATE = '84d2f7522ac946cfb5ec30587ea22d06';
const expirationTimeInSeconds = 604800;

// Generate and save token
export const generateAndSaveToken = async (req, res) => {
    try {
        const { channelName, uid = 0 } = req.body;

        if (!channelName || uid == null) {
            return res.status(400).json({ error: 'Channel name and UID are required' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        const role = RtcRole.PUBLISHER;

        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );

        // Save to database
        const newToken = new Token({
            channelName,
            uid,
            token
        });
        await newToken.save();

        res.status(201).json({ message: 'Token generated and saved', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get token and channel name
export const getTokenAndChannelName = async (req, res) => {
    try {
        const tokenData = await Token.findOne().sort({ createdAt: -1 });

        if (!tokenData) {
            return res.status(404).json({ message: 'No token found' });
        }

        res.status(200).json(tokenData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update channel name and regenerate token
// Update channel name and regenerate token
export const updateChannelNameAndToken = async (req, res) => {
    try {
        const { channelName } = req.body; // New channel name from request body
        const uid = 0; // Assume you want the same UID

        if (!channelName) {
            return res.status(400).json({ error: 'Channel name is required' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        const role = RtcRole.PUBLISHER;

        // Generate a new token for the updated channel name
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );

        // Save updated channel name and token in DB
        const updatedToken = new Token({
            channelName, // Updated channel name
            uid,
            token
        });
        await updatedToken.save();

        res.status(200).json({ message: 'Channel name updated and token regenerated', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

