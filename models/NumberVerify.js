const mongoose = require("mongoose");
const NumberVerifySchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: true, // Ensure phone number is unique
      sparse: true, // Allow multiple null values
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpires: {
      type: Date,
      default: Date.now() + 120 * 1000, // 2 minutes expiration time
    },
  },
  {
    timestamps: true,
  }
);

const NumberVerify = mongoose.model("numberVerify", NumberVerifySchema);
module.exports = NumberVerify;
