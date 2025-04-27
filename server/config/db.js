import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;  // This should be your connection string
    if (!dbURI) {
      console.error("MONGO_URI is not defined in .env");
      process.exit(1);
    }
    await mongoose.connect(dbURI);
    console.log('MongoDB Connected to codyssey');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
