import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;
    
    if (!dbURI) {
      console.error("ERROR: MONGO_URI is not defined in .env file");
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    
    // Add additional connection options for better error handling
    const conn = await mongoose.connect(dbURI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection error handlers
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export default connectDB;
