import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  channelName: { type: String, required: true }, // Channel name associated with the tokens
  uid: { type: Number, required: true }, // UID for the main token (usually 0 for users)
  token: { type: String, required: true }, // Main token for user (UID 0)
  subBotUid: { type: Number, required: true }, // UID for Sub Bot (e.g., 12345)
  subBotToken: { type: String, required: true }, // Sub Bot token (subscriber role)
  pubBotUid: { type: Number, required: true }, // UID for Pub Bot (e.g., 67890)
  pubBotToken: { type: String, required: true }, // Pub Bot token (publisher role)
}, { timestamps: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
