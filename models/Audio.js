import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  transcription: { type: String, required: true },
  transcriptionFilePath: { type: String, required: true },
}, { timestamps: true });

const Audio = mongoose.model('Audio', audioSchema);

export default Audio;