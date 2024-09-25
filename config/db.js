const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://auth:auth123456@cluster0.abqu9.mongodb.net/mybet27"
    );  // Removed the deprecated options
    console.log("MongoDB connected");
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
