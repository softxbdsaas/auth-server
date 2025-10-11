// JWT Secret
const JWT_SECRET ="4d45a2b24e6f55b7a594b2e9e1b1ec5aa2a8b87cb1c4984dbfd0378417e92e19";
const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract the token from "Bearer TOKEN"
  if (!token) {
    return res.status(403).send({ message: "No token provided." });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    console.log(err)
    if (err) {
      return res.status(403).send({ message: "Failed to authenticate token." });
    }
  console.log(user)
    req.user = user; // Save the user information in the request object for later use
    console.log(user);
    next();
  });
};

module.exports = { verifyToken };
