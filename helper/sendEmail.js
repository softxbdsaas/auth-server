const nodemailer = require("nodemailer");

const EmailSend = async (sendEmail, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: "shamimusman515419@gmail.com",
        pass: "uplcbldjmbfcrelk", // Make sure this is kept secure, don't hardcode sensitive data
      },
    });

    const info = await transporter.sendMail({
      from: "shamimusman515419@gmail.com",
      to: sendEmail, // Recipient's email address
      subject: subject, // Subject line
      text: text, // Plain text body
      html: html, // HTML body
    });
    if (info.messageId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return `Error sending email: ${error.message}`;
  }
};

// Export the function using CommonJS syntax
module.exports = { EmailSend };
