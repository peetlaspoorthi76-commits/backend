import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import leadRoutes from './routes/leadRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true })); // Using '*' for easy testing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`));