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
const { verifyToken } = require("../helper/verifyToken");
const router = express.Router();
const OTP_SENDER_URL = `http://sms.maya-bd.com:7788/sendtext?apikey=7a82860ccf0ec40b&secretkey=7fa00af7&callerID=12345`;
// JWT Secret
const JWT_SECRET =
  "4d45a2b24e6f55b7a594b2e9e1b1ec5aa2a8b87cb1c4984dbfd0378417e92e19";
const expiresTime = "1d";
// Helper Functions (Already defined in helper/index.js)

// Register
router.post("/register", async (req, res) => {
  const { name, email, phoneNumber, currency, country, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword, "hashedPasswordhashedPassword")


  try {
    // Check if email or phone number is provided
    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ msg: "Please provide either an email or phone number" });
    }

    // Check if user already exists by email
    // Check if user already exists by email, only if email is provided
    let user = null;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Check if user already exists by phone number
    if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
      if (user) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }
    // Generate random username if not provided
    const userName = generateRandomNumericUsername(10);

    // Generate random password
    const userPassword = password ? password : generateRandomPassword(8);

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create a new user object
    const newUser = {
      name,
      email,
      currency,
      country,
      userName,
      password: hashedPassword, // Save hashed password
    };

    // Only add phoneNumber if it's provided
    if (phoneNumber) {
      newUser.phoneNumber = phoneNumber;
    }

    // Create a new user instance
    user = new User(newUser);

    // Send email if provided
    if (email) {
      const sendEmail = email;
      const subject = "MyBet27 ";
      const text = "Hello world";
      const html = `
        <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
          <div style="width: 100%; max-width: 408px; margin: 0 auto; background-color: #ffffff;  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="padding: 20px; color: black; text-align: start; margin-top: 20px;">
              <p style="color: black; font-size: 16px;">Hi dear, your UserName and Password</p>
              <p style="color: black; font-size: 16px;">UserName: ${userName}</p>
              <p style="color: black; font-size: 16px;">Password: ${password ? password : userPassword
        }</p>
            </div>
            <div style="background-color:#00bbfc; text-align: center; padding: 30px; font-size: 14px;"></div>
            <div style="background-color:#f23209; text-align: center; padding: 22px; font-size: 14px;"></div>
          </div>
        </body>
      `;
      await EmailSend(sendEmail, subject, text, html);
    }

    // Send SMS if phone number provided
    if (phoneNumber) {
      await axios.post(
        `${OTP_SENDER_URL}&toUser=${phoneNumber}&messageContent=mybet27  UserId:${userName} and password:${password ? password : userPassword
        }`
      );
    }

    // Save the user in the database
    await user.save();

    // Create JWT payload and token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresTime });

    // Return the token and success message
    res.status(201).json({
      token,
      message: "User created successfully",
      status: true,
      password: userPassword,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server error", error: err.message });
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
      return res
        .status(400)
        .json({ message: "Invalid credentials", user, status: false });
    }

    // Compare provided password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials", status: false });
    }

    // Create JWT payload and token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresTime });

    res.json({ token, user, status: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ status: false, message: err.message });
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

// Route to get user info
router.get("/get-info", verifyToken, async (req, res) => {
  console.log("userIduserIduserIduserId");
  // At this point, req.user contains the verified user information
  const userId = req.user.userId; // Assuming you saved userId in the token payload
  const userInfo = await User.findById(userId);
  // You can fetch more user info from the database if needed
  // For demonstration, we'll just send a message along with the user ID
  return res.send({
    message: "User information retrieved successfully!",
    status: true,
    data: userInfo,
  });
});
router.post("/one-click", async (req, res) => {
  try {
    // Check if email or phone number is provided
    let user = null;
    // Generate random username if not provided
    const userName = generateRandomNumericUsername(10);

    // Generate random password
    const userPassword = generateRandomPassword(8);
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create a new user object
    const newUser = {
      userName,
      password: hashedPassword, // Save hashed password
    };

    user = new User(newUser);
    // Save the user in the database
    await user.save();

    // Create JWT payload and token
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresTime });

    // Return the token and success message
    res.status(201).json({
      token,
      message: "User created successfully",
      status: true,
      password: userPassword,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server error", error: err.message });
  }
});

//  social media login

router.post("/social-media-login", async (req, res) => {
  const { name, email, profileURL } = req.body;
  try {
    // Check if email or phone number is provided
    if (!email) {
      return res
        .status(400)
        .json({ msg: "Please provide either an email or phone number" });
    }

    // Check if user already exists by email
    // Check if user already exists by email, only if email is provided
    let user = null;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Create JWT payload and token
        const payload = { userId: user.id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresTime });

        // Return the token and success message
        res.status(201).json({
          token,
          message: "User created successfully",
          status: true,
          user,
        });
      } else {
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
          userName,
          profileURL,
          password: hashedPassword, // Save hashed password
        };
        // Create a new user instance
        user = new User(newUser);
        // Send email if provided
        if (email) {
          const sendEmail = email;
          const subject = "MyBet27 ";
          const text = "Hello world";
          const html = `
      <body style="font-family: Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="width: 100%; max-width: 408px; margin: 0 auto; background-color: #ffffff;  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="padding: 20px; color: black; text-align: start; margin-top: 20px;">
            <p style="color: black; font-size: 16px;">Hi dear, your UserName and Password</p>
            <p style="color: black; font-size: 16px;">UserName: ${userName}</p>
            <p style="color: black; font-size: 16px;">Password: ${userPassword}</p>
          </div>
          <div style="background-color:#00bbfc; text-align: center; padding: 30px; font-size: 14px;"></div>
          <div style="background-color:#f23209; text-align: center; padding: 22px; font-size: 14px;"></div>
        </div>
      </body>
    `;
          await EmailSend(sendEmail, subject, text, html);
        }
        // Save the user in the database
        await user.save();

        // Create JWT payload and token
        const payload = { userId: user.id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresTime });

        // Return the token and success message
        res.status(201).json({
          token,
          message: "User created successfully",
          status: true,
          password: userPassword,
          user,
        });
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server error", error: err.message });
  }
});

router.put("/update-profile-info", verifyToken, async (req, res) => {
  try {
    console.log("object");
    // At this point, req.user contains the verified user information
    const userId = req.user.userId; // Assuming you saved userId in the token payload

    // Find the user by ID in the database
    let userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.status(404).send({ message: "User not found" });
    }

    // Extract fields from request body
    const {
      name,
      phoneNumber,
      address,
      identityNumber,
      INDFrontendImage,
      INDBackendImage,
      dateOfBirth,
      country,
      email,
    } = req.body;
    console.log(req.body);

    // Update user information if provided in the request body
    userInfo.name = name;
    userInfo.phoneNumber = phoneNumber;
    userInfo.email = email;
    userInfo.address = address;
    userInfo.identityNumber = identityNumber;
    userInfo.INDFrontendImage = INDFrontendImage;
    userInfo.INDBackendImage = INDBackendImage;
    userInfo.dateOfBirth = dateOfBirth;
    userInfo.country = country;
    console.log(userInfo);

    // Save the updated user information back to the database
    await userInfo.save();

    // Return a success message with the updated user info
    return res.send({
      message: "Profile updated successfully",
      status: true,
      data: userInfo,
    });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .send({ message: "Server error", error: err.message });
  }
});

module.exports = router;
