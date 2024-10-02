import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  videoPath: { type: String, required: true },
  audioPath: { type: String, required: true },
});

const Video = mongoose.model('Video', videoSchema);

export default Video;