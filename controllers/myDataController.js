import MyData from "../models/MyData.js";
import { uploadVideo } from "./videoController.js";
import Transcription from "../models/transcriptionModel.js";



export const createDataWithUrl = async (req, res) => {
  try {
    const { cname, resourceId, sid, uid, appId } = req.body; 

    console.log("Received data from frontend:", { cname, resourceId, sid, uid, appId });

   
    const newData = new MyData({ cname, resourceId, sid, uid, appId });
    const savedData = await newData.save();

    console.log("Data saved to database:", savedData);

    
    return res.status(201).json({
      message: "Data saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("Error occurred:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};




  export const getAllData = async (req, res) => {
    try {
      const data = await MyData.find();
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error in getAllData:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  export const getDataById = async (req, res) => {
    try {
      const data = await MyData.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error in getDataById:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  export const getDataBySid = async (req, res) => {
    try {
      const { sid } = req.params;
      const data = await MyData.findOne({ sid });
      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error in getDataBySid:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  export const deleteData = async (req, res) => {
    try {
      const data = await MyData.findByIdAndDelete(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }
      return res.status(200).json({ message: "Data deleted successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };


  export const endMeeting = async (req, res) => {
    try {
      const { sid, fileName, hostStatus } = req.body;
      console.log("Received sid, fileName, and hostStatus:", { sid, fileName, hostStatus });
  
      // Check if a request with this sid exists in MyData
      const data = await MyData.findOne
      ({ sid });
      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }
  
      if (hostStatus) {
        // If hostStatus is true, process the video and transcription
        console.log("Host is processing the meeting.");
        
        // Update document with the fileName
        data.fileName = fileName;
        const updatedData = await data.save();
        console.log("Document updated with fileName:", updatedData);
  
        // Call the uploadVideo function to handle video processing and transcription
        await uploadVideo(req, res, sid);
  
      } else {
        // If hostStatus is false, check if a transcription already exists for the given sid
        console.log("Host has not finished processing. Waiting for transcription.");
  
        const waitForTranscription = async (sid, maxWaitTime = 120000, interval = 5000) => {
          let elapsedTime = 0;
  
          // Continuously check every interval (5 seconds in this case)
          while (elapsedTime < maxWaitTime) {
            const transcription = await Transcription.findOne({ sid });
            if (transcription) {
              // If the transcription is found, return it
              return transcription;
            }
  
            // Wait for the specified interval before checking again
            await new Promise((resolve) => setTimeout(resolve, interval));
            elapsedTime += interval;
          }
  
          // If no transcription is found within the maxWaitTime, return null
          return null;
        };
  
        const transcription = await waitForTranscription(sid);
  
        if (transcription) {
          // Transcription found, send the complete transcription object
          return res.status(200).json({
            message: "Transcription found",
            transcription, // Send the whole transcription object
          });
        } else {
          // Transcription not found after waiting
          return res.status(404).json({ message: "Transcription not found after waiting for 2 minutes" });
        }
      }
    } catch (error) {
      console.error("Error in endMeeting:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  
  
  
  

  


