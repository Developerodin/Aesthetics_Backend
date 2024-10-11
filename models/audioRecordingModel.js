// models/audioRecordingModel.js
import mongoose from 'mongoose';

const audioRecordingSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AudioRecording = mongoose.model('AudioRecording', audioRecordingSchema);

export default AudioRecording;
