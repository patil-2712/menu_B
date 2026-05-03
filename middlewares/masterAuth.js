// middlewares/masterAuth.js
const jwt = require("jsonwebtoken");
const MasterUser = require("../models/MasterUser");

exports.verifyMasterToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "master-secret-key-2024");
    
    if (decoded.type !== "master") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Invalid token type."
      });
    }
    
    const user = await MasterUser.findById(decoded.id).select('-password -phonePassword');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found."
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};