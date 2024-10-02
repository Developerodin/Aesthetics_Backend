import mongoose from 'mongoose';

const user = "abhishekanjana85";
const pass = "SUjadcN67qd8wnDy";
const url = `mongodb+srv://${user}:${pass}@cluster0.aachg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const connection = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('DB CONNECTION ESTABLISHED');
  } catch (err) {
    console.log(err);
  }
};

export default connection;