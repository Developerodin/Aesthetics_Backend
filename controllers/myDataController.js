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
