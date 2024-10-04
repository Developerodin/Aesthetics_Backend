// models/Token.js
import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  channelName: { type: String, required: true },
  uid: { type: Number, required: true },
  token: { type: String, required: true }
}, { timestamps: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
