import MyData from "../models/MyData.js";

export const createDataWithUrl = async (req, res) => {
  try {
    const { cname, resourceId, sid, uid, appId } = req.body;

    const agoraUrl = `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;

    const newData = new MyData({ cname, resourceId, sid, uid, appId });
    const savedData = await newData.save();

    return res.status(201).json({
      message: "Data saved successfully",
      data: savedData,
      agoraUrl,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAllData = async (req, res) => {
  try {
    const data = await MyData.find();

    const dataWithUrls = data.map((item) => {
      const agoraUrl = `https://api.agora.io/v1/apps/${item.appId}/cloud_recording/resourceid/${item.resourceId}/sid/${item.sid}/mode/mix/query`;
      return {
        ...item._doc,
        agoraUrl,
      };
    });

    return res.status(200).json(dataWithUrls);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getDataById = async (req, res) => {
  try {
    const data = await MyData.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    const agoraUrl = `https://api.agora.io/v1/apps/${data.appId}/cloud_recording/resourceid/${data.resourceId}/sid/${data.sid}/mode/mix/query`;

    return res.status(200).json({
      ...data._doc,
      agoraUrl,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
