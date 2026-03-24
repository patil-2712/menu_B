const mongoose = require("mongoose");
const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const { upload } = require("../config/cloudinary");

// Get all menu items for a specific restaurant
exports.getMenuByRestaurant = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const restaurant = await Restaurant.findOne({ restaurantSlug: slug });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    const menuItems = await Menu.find({ restaurantSlug: slug })
      .sort({ category: 1, name: 1 });
    
    // Map to include full image URL (already Cloudinary URL)
    const itemsWithImageUrl = menuItems.map(item => ({
      ...item.toObject(),
      imageUrl: item.image || null
    }));
    
    res.json(itemsWithImageUrl);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get categories for a specific restaurant
exports.getCategoriesByRestaurant = async (req, res) => {
  try {
    const { slug } = req.params;
    const categories = await Menu.distinct('category', { restaurantSlug: slug });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Create new menu item - WITH CLOUDINARY UPLOAD
exports.createMenuItem = (req, res) => {
  upload.single('image')(req, res, async function(err) {
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      const { slug } = req.params;
      const { name, type, category, price } = req.body;
      
      console.log("=== CREATE MENU ITEM ===");
      console.log("Restaurant Slug:", slug);
      console.log("Uploaded file:", req.file);
      
      const restaurant = await Restaurant.findOne({ restaurantSlug: slug });
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (!category || category.trim() === '') {
        return res.status(400).json({ message: "Category is required" });
      }
      
      // Get image URL from Cloudinary
      const imageUrl = req.file ? req.file.path : null;
      
      const menuItem = new Menu({
        restaurantId: restaurant._id,
        restaurantSlug: slug,
        restaurantCode: restaurant.restaurantCode,
        restaurantName: restaurant.restaurantName,
        name: name.trim(),
        type,
        category: category.trim(),
        price: parseFloat(price),
        image: imageUrl // Store Cloudinary URL
      });
      
      await menuItem.save();
      
      console.log("Menu item created successfully:", menuItem.name);
      
      res.status(201).json({
        message: "Menu item created successfully",
        menuItem: {
          ...menuItem.toObject(),
          imageUrl: menuItem.image
        }
      });
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

// Update menu item
exports.updateMenuItem = (req, res) => {
  upload.single('image')(req, res, async function(err) {
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      const { slug, id } = req.params;
      const { name, type, category, price } = req.body;
      
      const updateData = {
        name,
        type,
        category,
        price: parseFloat(price),
        updatedAt: Date.now()
      };
      
      // If new image uploaded, update image field with Cloudinary URL
      if (req.file) {
        updateData.image = req.file.path;
      }
      
      const menuItem = await Menu.findOneAndUpdate(
        { _id: id, restaurantSlug: slug },
        updateData,
        { new: true }
      );
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json({
        message: "Menu item updated successfully",
        menuItem: {
          ...menuItem.toObject(),
          imageUrl: menuItem.image
        }
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { slug, id } = req.params;
    
    const menuItem = await Menu.findOneAndDelete({ 
      _id: id, 
      restaurantSlug: slug 
    });
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};