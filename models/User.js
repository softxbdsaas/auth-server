const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  userName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    unique: true, // Ensure phone number is unique
    sparse: true, // Allow multiple null values
  },
  country: {
    type: String,
  },
  currency: {
    type: String,
  },
  email: {
    type: String,
    unique: true, // Ensure email is unique
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
