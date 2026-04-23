import mongoose from "mongoose";

export const connectDB = async () => {
  const env = typeof process !== "undefined" ? process.env : {};
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    if (typeof process !== "undefined") {
      process.exit(1);
    }
    throw error;
  }
};
