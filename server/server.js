import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve('..', '.env')});  // This loads the .env file

import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';  // Import the cors package

const app = express();

// Connect to MongoDB
connectDB();

// Add CORS middleware to allow frontend to communicate with the backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Other middleware and routes
app.use(express.json());

// Add a health check endpoint for connectivity testing
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Mount auth routes - provide both paths to support existing code
app.use('/api/auth', authRoutes);

// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: http://localhost:5173`);
});
