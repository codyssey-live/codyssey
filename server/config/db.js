import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;
    
    if (!dbURI) {
 
      process.exit(1);
    }
    
    // Add additional connection options for better error handling
    const conn = await mongoose.connect(dbURI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 50000,
      socketTimeoutMS: 45000,
    });
       
    // Add connection error handlers
    mongoose.connection.on('error', err => {
    });
    
    mongoose.connection.on('disconnected', () => {
    });
    
  } catch (error) {
    process.exit(1);
  }
};

export default connectDB;
