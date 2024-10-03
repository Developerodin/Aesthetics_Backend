import MyData from "../models/MyData.js";


import axios from "axios";

export const createDataWithUrl = async (req, res) => {
  try {
    const { cname, resourceId, sid, uid, appId } = req.body;

    console.log("Received data from frontend:", { cname, resourceId, sid, uid, appId });

    // Construct the Agora URL
    const agoraUrl = `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
    console.log("Constructed Agora URL:", agoraUrl);

    // Credentials
    const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
    const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString("base64");
    const authorizationField = `Basic ${encodedCredential}`;
    console.log("Authorization header:", authorizationField);

    // Send the GET request to Agora
    console.log("Sending GET request to Agora...");
    const agoraResponse = await axios.get(agoraUrl, {
      headers: {
        Authorization: authorizationField,
        "Content-Type": "application/json",
      },
    });

    console.log("Received response from Agora:", agoraResponse.data);

    // Extract fileList from serverResponse if present
    const fileName = agoraResponse.data.serverResponse?.fileList;
    console.log("Extracted fileList from response:", fileName);

    // Save the data to the database, including the fileName
    const newData = new MyData({ cname, resourceId, sid, uid, appId, fileName });
    const savedData = await newData.save();
    console.log("Data saved to database:", savedData);

    // Return the response with saved data and the Agora response
    return res.status(201).json({
      message: "Data saved successfully",
      data: savedData,
      agoraResponse: agoraResponse.data,
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

    const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
    const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString("base64");
    const authorizationField = `Basic ${encodedCredential}`;

    const dataWithUrls = await Promise.all(
      data.map(async (item) => {
        const agoraUrl = `https://api.agora.io/v1/apps/${item.appId}/cloud_recording/resourceid/${item.resourceId}/sid/${item.sid}/mode/mix/query`;

        // Send GET request to Agora API
        const agoraResponse = await axios.get(agoraUrl, {
          headers: {
            Authorization: authorizationField,
            "Content-Type": "application/json",
          },
        });

        // Extract fileList and save it as fileName
        const fileName = agoraResponse.data.serverResponse?.fileList || item.fileName;

        // Update the document with the new fileName
        if (fileName && fileName !== item.fileName) {
          item.fileName = fileName;
          await item.save();
        }

        return {
          ...item._doc,
          agoraUrl,
          agoraResponse: agoraResponse.data,
        };
      })
    );

    return res.status(200).json(dataWithUrls);
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

    const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
    const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString("base64");
    const authorizationField = `Basic ${encodedCredential}`;

    const agoraUrl = `https://api.agora.io/v1/apps/${data.appId}/cloud_recording/resourceid/${data.resourceId}/sid/${data.sid}/mode/mix/query`;

    // Send GET request to Agora API
    const agoraResponse = await axios.get(agoraUrl, {
      headers: {
        Authorization: authorizationField,
        "Content-Type": "application/json",
      },
    });

    // Extract fileList and save it as fileName
    const fileName = agoraResponse.data.serverResponse?.fileList || data.fileName;

    // Update the document with the new fileName
    if (fileName && fileName !== data.fileName) {
      data.fileName = fileName;
      await data.save();
    }

    return res.status(200).json({
      ...data._doc,
      agoraUrl,
      agoraResponse: agoraResponse.data,
    });
  } catch (error) {
    console.error("Error in getDataById:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getDataBySid = async (req, res) => {
  try {
    const { sid } = req.params;  // Get sid from the request parameters
    const data = await MyData.findOne({ sid }); // Fetch data using sid

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    // Prepare authorization credentials
    const customerKey = "19a1e3a14f1a4c37be0cd382b5c8351a"; // Replace with your customer ID
    const customerSecret = "14af535508b943cabf8f56da50f93488"; // Replace with your customer secret
    const plainCredential = `${customerKey}:${customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString("base64");
    const authorizationField = `Basic ${encodedCredential}`;

    // Construct the Agora API URL
    const agoraUrl = `https://api.agora.io/v1/apps/${data.appId}/cloud_recording/resourceid/${data.resourceId}/sid/${data.sid}/mode/mix/query`;

    // Send GET request to Agora API
    const agoraResponse = await axios.get(agoraUrl, {
      headers: {
        Authorization: authorizationField,
        "Content-Type": "application/json",
      },
    });

    // Extract fileList from the response
    const fileList = agoraResponse.data.serverResponse.fileList;

    // Save the fileName to the database if needed
    data.fileName = fileList;  // Assuming you want to add this to the existing data
    await data.save();  // Save the updated data back to the database

    return res.status(200).json({
      ...data._doc,
      agoraUrl,
      fileName: fileList, // Add fileList as fileName in the response
    });
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
    const { sid } = req.body; // Get sid from the request body

    // Call the getDataBySid function to fetch data by sid
    const dataResponse = await axios.get(`https://aesthetics-backend.onrender.com/api/myData/sid/${sid}`);
    const data = dataResponse.data;

    // Extract fileName
    const fileName = data.fileName;

    // Prepare the payload for the POST request
    const payload = {
      fileName: fileName,
    };

    // Send POST request to /api/vide/upload
    const uploadResponse = await axios.post('https://aesthetics-backend.onrender.com/api/video/upload', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).json({
      message: "Meeting ended successfully",
      uploadResponse: uploadResponse.data, // Include response from upload endpoint if needed
    });
  } catch (error) {
    console.error("Error in endMeeting:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

