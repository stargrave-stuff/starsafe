const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const connectDB = async () => {
    // 1. Check if the URI is set
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI not found in .env file.");
        return;
    }

    // 2. Attempt to connect
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Successfully connected to MongoDB!");

    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        // Exit process if unable to connect
        process.exit(1);
    }
};

module.exports = connectDB;