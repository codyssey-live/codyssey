import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config({ path: path.resolve('..', '.env') });

const app = express();

// 1. Parse incoming JSON first
app.use(express.json());

// 2. Add cookie-parser
app.use(cookieParser());

// 3. Then setup CORS with credentials support
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// 4. Healthcheck route (before DB connection)
app.get('/api/healthcheck', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 5. Connect to MongoDB
connectDB();  // Connect AFTER healthcheck (optional), but must succeed

// 6. Set up other routes
app.use('/api/auth', authRoutes);

// 7. Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for origin: http://localhost:5173`);
});
