const crypto = require('crypto')

const generateOtp = () => {
  // crypto is built into Node.js — no install needed
  // generates a random number between 100000 and 999999
  const otp = crypto.randomInt(100000, 999999).toString()
  
  // OTP expires 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  
  return { otp, expiresAt }
}
// TEMPORARY TEST — delete after testing
// console.log(generateOtp())
module.exports = generateOtp