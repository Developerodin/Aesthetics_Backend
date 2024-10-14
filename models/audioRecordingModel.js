// models/audioRecordingModel.js
import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true,
  },
  startTime: {
    type: Number, // Timestamp (in seconds) indicating the start time of the chunk
    required: true,
  },
  endTime: {
    type: Number, // Timestamp (in seconds) indicating the end time of the chunk
    required: true,
  },
});

const audioRecordingSchema = new mongoose.Schema({
  originalFilePath: {
    type: String,
    required: true,
  },
  chunks: [chunkSchema], // An array to store the chunks and their timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AudioRecording = mongoose.model('AudioRecording', audioRecordingSchema);

export default AudioRecording;
