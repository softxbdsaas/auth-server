const express = require("express");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

const app = express();
const PORT = process.env.VITE_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// Connect to MongoDB
connectDB();
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);  // Fixed string interpolation with backticks
});

// Routes
app.use("/api/auth", require("./routes/auth"));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
