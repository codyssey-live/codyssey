import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve('..', '.env')});  // This loads the .env file

import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';  // Example import

const app = express();

// Connect to MongoDB
connectDB();

// Other middleware and routes
app.use(express.json());
app.use('/api/auth', authRoutes);

// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
