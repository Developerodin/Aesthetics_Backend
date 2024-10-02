import MyData from '../models/MyData.js';

// Create new data
export const createData = async (req, res) => {
  try {
    const { cname, resourceId, sid, uid } = req.body;
    const newData = new MyData({ cname, resourceId, sid, uid });
    const savedData = await newData.save();
    return res.status(201).json({ message: 'Data saved successfully', data: savedData });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all data
export const getAllData = async (req, res) => {
  try {
    const data = await MyData.find();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get data by ID
export const getDataById = async (req, res) => {
  try {
    const data = await MyData.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete data
export const deleteData = async (req, res) => {
  try {
    const data = await MyData.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    return res.status(200).json({ message: 'Data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};