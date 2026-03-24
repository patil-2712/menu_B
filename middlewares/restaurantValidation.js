const { body } = require("express-validator");
const Restaurant = require("../models/Restaurant");

exports.registerRestaurantValidation = [
  // Restaurant Name
  body("restaurantName")
    .trim()
    .notEmpty().withMessage("Restaurant name is required")
    .isLength({ min: 3 }).withMessage("Restaurant name must be at least 3 characters")
    .custom(async (value) => {
      const exists = await Restaurant.findOne({ restaurantName: value });
      if (exists) {
        throw new Error("Restaurant name already exists");
      }
      return true;
    }),

  // Mobile Number
  body("mobile")
    .trim()
    .notEmpty().withMessage("Restaurant mobile number is required")
    .isNumeric().withMessage("Mobile must contain only numbers")
    .isLength({ min: 10, max: 10 }).withMessage("Mobile must be exactly 10 digits")
    .custom(async (value) => {
      const exists = await Restaurant.findOne({ mobile: value });
      if (exists) {
        throw new Error("Mobile number already registered");
      }
      return true;
    }),

  // Email
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .custom(async (value) => {
      const exists = await Restaurant.findOne({ email: value });
      if (exists) {
        throw new Error("Email already registered");
      }
      return true;
    }),

  // GST Number (Optional)
  body("gstNumber")
    .optional()
    .trim()
    .isLength({ min: 15, max: 15 }).withMessage("GST number must be 15 characters")
    .custom(async (value) => {
      if (value) {
        const exists = await Restaurant.findOne({ gstNumber: value });
        if (exists) {
          throw new Error("GST number already registered");
        }
      }
      return true;
    }),

  // Food License (Optional)
  body("foodLicense")
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage("Food license number must be at least 5 characters")
    .custom(async (value) => {
      if (value) {
        const exists = await Restaurant.findOne({ foodLicense: value });
        if (exists) {
          throw new Error("Food license already registered");
        }
      }
      return true;
    }),
 body('gstPercentage')  // Add this validation
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('GST percentage must be a number between 0 and 100'),
  
  // City
  body("city")
    .trim()
    .notEmpty().withMessage("City is required")
    .isLength({ min: 2 }).withMessage("City must be at least 2 characters"),

  // State
  body("state")
    .trim()
    .notEmpty().withMessage("State is required")
    .isLength({ min: 2 }).withMessage("State must be at least 2 characters"),

  // Country
  body("country")
    .trim()
    .notEmpty().withMessage("Country is required")
    .isLength({ min: 2 }).withMessage("Country must be at least 2 characters"),

  // Nearest Place
  body("nearestPlace")
    .trim()
    .notEmpty().withMessage("Nearest place is required")
    .isLength({ min: 3 }).withMessage("Nearest place must be at least 3 characters"),

  // Kitchen Username
  body("kitchenUsername")
    .trim()
    .notEmpty().withMessage("Kitchen username is required")
    .isLength({ min: 3 }).withMessage("Kitchen username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Kitchen username can only contain letters, numbers and underscores")
    .custom(async (value) => {
      const trimmedValue = value.trim();
      const exists = await Restaurant.findOne({ kitchenUsername: trimmedValue });
      if (exists) {
        throw new Error("Kitchen username already exists");
      }
      return true;
    }),

  // Kitchen Password
  body("kitchenPassword")
    .trim()
    .notEmpty().withMessage("Kitchen password is required")
    .isLength({ min: 6 }).withMessage("Kitchen password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage("Kitchen password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),

  // Billing Username
  body("billingUsername")
    .trim()
    .notEmpty().withMessage("Billing username is required")
    .isLength({ min: 3 }).withMessage("Billing username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Billing username can only contain letters, numbers and underscores")
    .custom(async (value) => {
      const trimmedValue = value.trim();
      const exists = await Restaurant.findOne({ billingUsername: trimmedValue });
      if (exists) {
        throw new Error("Billing username already exists");
      }
      return true;
    }),

  // Billing Password
  body("billingPassword")
    .trim()
    .notEmpty().withMessage("Billing password is required")
    .isLength({ min: 6 }).withMessage("Billing password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage("Billing password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),

  // Owner Password
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),

  // Confirm Password
  body("confirmPassword")
    .trim()
    .notEmpty().withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  // Owner Name (Optional)
  body("ownerName")
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage("Owner name must be at least 2 characters"),

  // Owner Mobile (Optional)
  body("ownerMobile")
    .optional()
    .trim()
    .isNumeric().withMessage("Owner mobile must contain only numbers")
    .isLength({ min: 10, max: 10 }).withMessage("Owner mobile must be 10 digits")
];

exports.loginValidation = [
  // Username/Email based on role
  body("username")
    .trim()
    .notEmpty().withMessage("Username/Email is required"),

  // Password
  body("password")
    .trim()
    .notEmpty().withMessage("Password is required"),

  // Role
  body("role")
    .trim()
    .notEmpty().withMessage("Role is required")
    .isIn(['owner', 'kitchen', 'billing']).withMessage("Role must be owner, kitchen, or billing")
];
///////////////////////
