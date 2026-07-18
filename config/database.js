
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB Atlas
console.log("Connecting to:", process.env.MONGODB_URI); // ADD THIS
const conn = await mongoose.connect(process.env.MONGODB_URI);
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // This forces Mongoose to use IPv4, bypassing the DNS/IPv6 issues
    });
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};