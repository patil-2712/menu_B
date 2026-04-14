const express = require("express");
const router = express.Router();
const {
  getMenuByRestaurant,
  getCategoriesByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");

// Routes
router.get("/restaurant/:slug", getMenuByRestaurant);
router.get("/restaurant/:slug/categories", getCategoriesByRestaurant);
router.post("/restaurant/:slug", createMenuItem); // Will handle multipart/form-data
router.put("/restaurant/:slug/:id", updateMenuItem); // Will handle multipart/form-data
router.delete("/restaurant/:slug/:id", deleteMenuItem);

module.exports = router;