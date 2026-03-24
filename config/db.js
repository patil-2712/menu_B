const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // For MongoDB Atlas (cloud):
     const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // For local MongoDB:
    //const conn = await mongoose.connect(`MONGO_URI`);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;