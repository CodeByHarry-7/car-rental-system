const { body } = require('express-validator')

// ─────────────────────────────────────────────
// REGISTER VALIDATOR
// Runs before register() controller
// If any check fails, controller reads the
// errors via validationResult(req) and returns
// ─────────────────────────────────────────────
const registerValidator = [

  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)'),

  body('date_of_birth')
    .notEmpty().withMessage('Date of birth is required')
    .isDate().withMessage('Enter a valid date of birth')
    .custom((dob) => {
      const today = new Date()
      const birthDate = new Date(dob)

      // Calculate exact age
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      // Adjust if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) {
        throw new Error('You must be at least 18 years old to register')
      }

      // Sanity check — no one is 120 years old
      if (age > 120) {
        throw new Error('Please enter a valid date of birth')
      }

      return true
    }),

]

// ─────────────────────────────────────────────
// LOGIN VALIDATOR
// Minimal — just format checks
// Real auth happens in controller
// ─────────────────────────────────────────────
const loginValidator = [

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

]

module.exports = { registerValidator, loginValidator }