const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  generateRandomNumericUsername,
  generateRandomPassword,
} = require("../helper/idnex");
const { EmailSend } = require("../helper/sendEmail");
const router = express.Router();

// JWT Secret
const JWT_SECRET = "mysecrettoken";

// Helper Functions (Already defined in helper/index.js)

// Register
router.post("/register", async (req, res) => {
  const { name, email, phoneNumber, currency, country, password } = req.body;
  try {
    // Check if email or phone number is provided
    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ msg: "Please provide either an email or phone number" });
    }

    // Check if user already exists by email or phone number
    let user = await User.findOne({ email });
    user = await User.findOne({ phoneNumber });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate random username if not provided
    const userName = generateRandomNumericUsername(10);

    // Generate random password
    const userPassword = generateRandomPassword(8);

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create a new user object
    const newUser = {
      name,
      email,
      currency,
      country,
      userName,
      password: password ? password : hashedPassword, // Save hashed password
    };

    //  email   template
    const sendEmail = email;
    const subject = "MyBet27 ";
    const text = "Hello world";
    const html = `
    <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
  <div style="width: 100%; max-width: 408px; margin: 0 auto; background-color: #ffffff;  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
    <!-- Header Section -->
    <!-- Main Body Section -->
    <div style="padding: 20px; color: black; text-align: start; margin-top: 20px;">
      <p style="color: black; font-size: 16px;">Hi dear, your UserName and Password</p>
        <p style="color: black; font-size: 16px;">UserName: ${userName}</p>
        <p style="color: black; font-size: 16px;">Password: ${userPassword}</p>
        </div>

    <!-- Footer Section -->
    <div style="background-color:#00bbfc; text-align: center; padding: 30px; font-size: 14px;"></div>
    <div style="background-color:#f23209; text-align: center; padding: 22px; font-size: 14px;"></div>
  </div>
</body>
`;

    // Only add phoneNumber if it's provided
    if (phoneNumber) {
      newUser.phoneNumber = phoneNumber;
    }

    // Create a new user instance
    user = new User(newUser);
    if (email) {
      await EmailSend(sendEmail, subject, text, html);
    }
    // Save the user in the database
    await user.save();

    // Create JWT payload and token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    // Return the token and success message
    res.json({
      token,
      message: "User created successfully",
      status: true,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, userName, password } = req.body;
  try {
    let user = email
      ? await User.findOne({ email })
      : await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials", user });
    }

    // Compare provided password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT payload and token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user, status: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
