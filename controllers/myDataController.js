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

let ongoingProcesses = {}; // To track ongoing processes and cache responses for each SID

export const endMeeting = async (req, res) => {
  try {
    const { sid, fileName, hostStatus } = req.body;
    console.log("Received sid, fileName, and hostStatus:", { sid, fileName, hostStatus });

    // Check if a request with this sid is already being processed or completed
    if (ongoingProcesses[sid] && ongoingProcesses[sid].response) {
      console.log(`Meeting for sid: ${sid} already processed. Returning cached response.`);
      return res.status(200).json(ongoingProcesses[sid].response);
    }

    // If hostStatus is false, wait for the host to finish processing
    if (!hostStatus) {
      if (ongoingProcesses[sid] && ongoingProcesses[sid].processing) {
        console.log(`Meeting for sid: ${sid} is in progress. Waiting for host's response.`);
        return res.status(202).json({ message: "Waiting for host to finish processing." });
      } else {
        return res.status(400).json({ message: "No host has initiated the process yet." });
      }
    }

    // If hostStatus is true, the host should process the request
    if (hostStatus) {
      // Initialize the process for this sid (mark it as being processed)
      ongoingProcesses[sid] = { processing: true, response: null };

      // Find data by SID
      const data = await MyData.findOne({ sid });
      if (!data) {
        // Reset the process cache for this SID in case of an error
        delete ongoingProcesses[sid];
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

      // Create the final response
      const response = {
        message: "Meeting ended and file uploaded successfully",
        uploadResponse: uploadResponse.data,
      };

      // Cache the response so that subsequent requests with the same sid get the same response
      ongoingProcesses[sid].response = response;

      // After successful processing, return the response
      return res.status(200).json(response);
    }
  } catch (error) {
    // In case of an error, reset the cache for the sid
    delete ongoingProcesses[req.body.sid];
    console.error("Error in endMeeting:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    // Ensure the process cache is cleared after completion (success or error)
    delete ongoingProcesses[req.body.sid];
  }
};

  
  

  


