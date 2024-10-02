import mongoose from 'mongoose';

const myDataSchema = new mongoose.Schema({
  cname: { type: String, required: true },
  resourceId: { type: String, required: true },
  sid: { type: String, required: true },
  uid: { type: String, required: true }
}, { timestamps: true });

const MyData = mongoose.model('MyData', myDataSchema);

export default MyData;