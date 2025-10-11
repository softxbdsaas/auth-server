const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    userName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    country: {
      type: String,
    },
    currency: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileURL: {
      type: String,
    },
    address: {
      type: String,
    },
    identityNumber: {
      type: String,
    },
    NIDBackendImage: {
      type: String,
    },
    NIDFrontendImage: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields automatically
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
