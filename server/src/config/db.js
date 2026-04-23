import mongoose from "mongoose";
import { getEnvValue } from "./env.js";

export const connectDB = async () => {
  try {
    const mongoUri = getEnvValue("MONGO_URI");
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    if (typeof process !== "undefined") {
      process.exit(1);
    }
    throw error;
  }
};
