import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  videoPath: { type: String, required: true },
  audioPath: { type: String, required: true },
  text: { type: String, required: false },
});

const Video = mongoose.model('Video', videoSchema);

export default Video;