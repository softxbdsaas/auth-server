const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  generateRandomNumericUsername,
  generateRandomPassword,
} = require("../helper/idnex");
const { EmailSend } = require("../helper/sendEmail");
const { default: axios } = require("axios");
const NumberVerify = require("../models/NumberVerify");
const router = express.Router();
const OTP_SENDER_URL = `http://sms.maya-bd.com:7788/sendtext?apikey=7a82860ccf0ec40b&secretkey=7fa00af7&callerID=12345`;
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

    if (phoneNumber) {
      await axios.post(
        `${OTP_SENDER_URL}&toUser=${phoneNumber}&messageContent=mybet27  UserName:${userName} and password:${
          password ? password : userPassword
        }`
      );
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

router.post("/verify-phone", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Check if code and phoneNumber are provided
    if (!phoneNumber) {
      return res.status(400).json({ msg: "Please provide  phone number" });
    }
    // TODO: Implement code verification logic here
    const otp = parseInt(
      Math.floor(100000 + Math.random() * 900000).toString()
    );
    // Send OTP to the phone number
    const { data } = await axios.post(
      `${OTP_SENDER_URL}&toUser=${phoneNumber}&messageContent=mybet27 phone number verify Otp:${otp}`
    );
    const result = await NumberVerify.create({ phoneNumber, otp });
    if (result && data) {
      return res.json({
        status: true,
        message: "Verification code sent successfully",
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed to send verification code",
      });
    }
    // TODO: Send the verification code to the user's phone number
  } catch {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ msg: "Please provide phone number" });
    }
    if (!otp) {
      return res.status(400).json({ msg: "Please provide otp number" });
    }
    const verifyInfo = await NumberVerify.findOne({ phoneNumber: phoneNumber });
    if (!verifyInfo || verifyInfo.otp !== otp) {
      return res.json({ error: "Invalid OTP or OTP expired" });
    }
    await NumberVerify.findByIdAndDelete(verifyInfo._id);
    return res.json({
      status: true,
      message: "OTP verified successfully",
      verifyInfo,
    });
  } catch (error) {
    res.status(500).send({ state: false, message: error.message });
  }
});

module.exports = router;
