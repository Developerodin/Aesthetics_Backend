import MyData from "../models/MyData.js";


import axios from "axios";

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

  // Cache to store ongoing processing for each sid
  let processingCount = 0; // Initialize count as 0 (no requests being processed)

  export const endMeeting = async (req, res) => {
    try {
      // Check if a request is already being processed
      if (processingCount > 0) {
        return res.status(400).json({ message: "Work in progress. Please wait until the current request is completed." });
      }
  
      // Increment the count to 1, indicating a request is being processed
      processingCount = 1;
      console.log("Processing started, count set to 1");
  
      const { sid, fileName } = req.body;
      console.log("Received sid and fileName:", { sid, fileName });
  
      // Find data by SID
      const data = await MyData.findOne({ sid });
      if (!data) {
        // Reset count to 0 before returning error
        processingCount = 0;
        return res.status(404).json({ message: "Data not found for the given sid" });
      }
  
      // Update document with the fileName
      data.fileName = fileName;
      const updatedData = await data.save();
      console.log("Document updated with fileName:", updatedData);
  
      // Prepare payload for the video upload
      const payload = {
        fileName: fileName,
      };
      console.log("Payload to be sent to video/upload:", payload);
  
      // Send request to the video upload endpoint
      const uploadResponse = await axios.post('https://aesthetics-backend.onrender.com/api/video/upload', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("Response from video/upload:", uploadResponse.data);
  
      // Reset the count back to 0 after successful processing
      processingCount = 0;
      console.log("Processing completed, count reset to 0");
  
      return res.status(200).json({
        message: "Meeting ended and file uploaded successfully",
        uploadResponse: uploadResponse.data,
      });
    } catch (error) {
      // Reset count to 0 in case of any errors
      processingCount = 0;
      console.error("Error in endMeeting:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

  


