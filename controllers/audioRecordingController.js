// controllers/audioRecordingController.js
import AudioRecording from '../models/audioRecordingModel.js';

// Controller for uploading audio
export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create a new audio recording entry
    const newRecording = new AudioRecording({
      filePath: req.file.path,
    });

    // Save the audio recording to the database
    await newRecording.save();

    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: req.file.path,
      recordingId: newRecording._id,
    });
  } catch (error) {
    console.error('Error uploading audio file:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
