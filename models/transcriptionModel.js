import mongoose from 'mongoose';

const transcriptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sid: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const Transcription = mongoose.model('Transcription', transcriptionSchema);

export default Transcription;