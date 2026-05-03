// routes/masterAuthRoutes.js
const express = require("express");
const router = express.Router();
const masterAuthController = require("../controllers/masterAuthController");
const { verifyMasterToken } = require("../middlewares/masterAuth");

// Public routes
router.post("/create-master-user", masterAuthController.createMasterUser);
router.post("/login", masterAuthController.masterLogin);

// Protected routes
router.get("/profile", verifyMasterToken, masterAuthController.getMasterProfile);
router.post("/logout", verifyMasterToken, masterAuthController.masterLogout);
router.get("/all-users", verifyMasterToken, masterAuthController.getAllMasterUsers);
router.delete("/delete-user/:id", verifyMasterToken, masterAuthController.deleteMasterUser);

module.exports = router;