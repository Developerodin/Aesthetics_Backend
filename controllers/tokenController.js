import pkg from 'agora-access-token';
import Token from '../models/Token.js';

const { RtcRole, RtcTokenBuilder } = pkg;

const APP_ID = '95ee23773c964b6baf93d16dbfcb3fe4'; // Your Agora App ID
const APP_CERTIFICATE = '84d2f7522ac946cfb5ec30587ea22d06'; // Your Agora App Certificate
const expirationTimeInSeconds = 604800; 

const uid = 0; // User UID, constant as 0
const subBotUid = 12345; // Sub Bot UID
const pubBotUid = 67890; // Pub Bot UID

// Generate and update all tokens (main token, subBotToken, pubBotToken)
export const updateAllTokens = async (req, res) => {
    try {
        const { channelName } = req.body; // Get the channelName from the request

        if (!channelName) {
            return res.status(400).json({ error: 'Channel name is required' });
        }

        // Get current timestamp
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Generate Main Token (User token with UID 0)
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            RtcRole.PUBLISHER, // User is a publisher
            privilegeExpiredTs
        );

        // Generate Sub Bot Token
        const subBotToken = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            subBotUid,
            RtcRole.SUBSCRIBER, // Sub Bot is a subscriber
            privilegeExpiredTs
        );

        // Generate Pub Bot Token
        const pubBotToken = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            pubBotUid,
            RtcRole.PUBLISHER, // Pub Bot is a publisher
            privilegeExpiredTs
        );

        // Check if the token already exists for the given channel name
        const existingToken = await Token.findOne({ channelName });

        if (existingToken) {
            // If token exists, update all tokens
            existingToken.token = token;
            existingToken.subBotToken = subBotToken;
            existingToken.pubBotToken = pubBotToken;
            await existingToken.save();

            return res.status(200).json({
                message: 'All tokens updated successfully',
                token,
                subBotToken,
                pubBotToken
            });
        }

        // If token does not exist, create a new entry
        const newTokenData = new Token({
            channelName,
            uid,
            token,
            subBotUid,
            subBotToken,
            pubBotUid,
            pubBotToken
        });

        await newTokenData.save();

        // Respond with all three tokens
        res.status(201).json({
            message: 'All tokens generated and saved successfully',
            token,
            subBotToken,
            pubBotToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get tokens by channel name
export const getTokensByChannelName = async (req, res) => {
    try {
        const { channelName } = req.params; // Get channelName from URL params

        const tokenData = await Token.findOne({ channelName });

        if (!tokenData) {
            return res.status(404).json({ message: 'No tokens found for this channel name' });
        }

        res.status(200).json({
            message: 'Tokens retrieved successfully',
            token: tokenData.token,
            subBotToken: tokenData.subBotToken,
            pubBotToken: tokenData.pubBotToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
