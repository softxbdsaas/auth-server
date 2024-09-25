function generateRandomNumericUsername(length) {
  let username = "";
  for (let i = 0; i < length; i++) {
    const randomDigit = Math.floor(Math.random() * 10); // Generates a random digit between 0 and 9
    username += randomDigit;
  }
  return username;
}

function generateRandomPassword(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

module.exports = {
  generateRandomNumericUsername,
  generateRandomPassword,
};
