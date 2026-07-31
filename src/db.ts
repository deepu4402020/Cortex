import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ??
      process.env.MONGODB_URI ??
      process.env.DATABASE_URL;

    if (typeof uri !== "string" || uri.trim().length === 0) {
      throw new Error(
        "Missing MongoDB connection string. Set `MONGO_URI` (or `MONGODB_URI` / `DATABASE_URL`) in your environment."
      );
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  } 
};

export default connectDB;
