import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import audioRoutes from './routes/audioRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import myDataRoutes from './routes/myDataRoutes.js';
import connection from './config/db.js';
import bodyParser from 'body-parser';


dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
  res.send('Welcome to my API')
})
app.use('/api/audio', audioRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/myData', myDataRoutes);

app.use('/uploads', express.static('uploads'));
app.use('/transcriptions', express.static('transcriptions'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connection();
  console.log(`Server is running on port ${PORT}`);
});