import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // database connection
import authRoutes from './routes/authRoutes.js'; 

import cors from 'cors'; // optional, for frontend-backend communication

// 1. ENV config
dotenv.config();

// 2. DB connection
connectDB();

// 3. Create app
const app = express();

// 4. Middlewares
app.use(express.json()); // to accept JSON data
app.use(cors()); 


// 5. Routes
app.use('/api/auth', authRoutes);


// 6. Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 7. Error handling middleware (optional but good)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

// 8. Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
