require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const restaurantRoutes = require("./routes/restaurantRoutes.js");
const menuRoutes = require("./routes/menuRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const feedbackRoutes = require('./routes/feedbackRoutes');
const app = express();

// Connect Database
connectDB();

// Create uploads directory if it doesn't exist (for local development fallback)
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Cache-Control',
    'X-Client-Version'
  ],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory (for local development)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/order", orderRoutes);
app.use('/api/feedback', feedbackRoutes);

// Test endpoints
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Backend API is running successfully!",
    timestamp: new Date().toISOString(),
    endpoints: {
      restaurant: "/api/restaurant",
      menu: "/api/menu",
      order: "/api/order",
      test: "/api/test"
    }
  });
});

app.get("/api", (req, res) => {
  res.json({ 
    message: "Restaurant Management API",
    version: "1.0.0",
    endpoints: {
      test: "GET /api/test",
      restaurant: "GET /api/restaurant/by-slug/:slug",
      menu: "GET /api/menu/restaurant/:slug",
      order: "POST /api/order/",
      kitchen: "GET /api/order/kitchen/:restaurantSlug"
    }
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Restaurant Management API is running",
    version: "1.0.0",
    docs: "Visit /api for available endpoints"
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: "Endpoint not found",
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "GET /",
      "GET /api",
      "GET /api/test",
      "GET /api/restaurant/by-slug/:slug",
      "GET /api/menu/restaurant/:slug",
      "POST /api/order/",
      "GET /api/order/kitchen/:restaurantSlug"
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: "CORS Error",
      error: err.message,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({ 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`✅ Kitchen orders: http://localhost:${PORT}/api/order/kitchen/:restaurantSlug`);
  console.log(`📁 Uploads folder: http://localhost:${PORT}/uploads/`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`\n🚀 Ready to accept connections!\n`);
});