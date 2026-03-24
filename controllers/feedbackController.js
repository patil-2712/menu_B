// controllers/feedbackController.js
const Feedback = require('../models/Feedback');

// ✅ FIXED: Import Order model from orderModel.js
let Order;
try {
  Order = require('../models/orderModel');
} catch (error) {
  console.log('⚠️ Order model not found, feedback submission may be limited');
  Order = null;
}

// ✅ FIXED: Import Restaurant model
let Restaurant;
try {
  Restaurant = require('../models/Restaurant');
} catch (error) {
  console.log('⚠️ Restaurant model not found, using default values');
  Restaurant = null;
}

// Submit new feedback
exports.submitFeedback = async (req, res) => {
  try {
    const {
      orderId,
      restaurantSlug,
      billNumber,
      serviceRating,
      foodRating,
      cleanlinessRating,
      comments,
      customerEmail,
      customerPhone,
      customerName = 'Guest',
      tableNumber = 'Takeaway'
    } = req.body;

    console.log('📝 Submitting feedback for bill:', billNumber);

    // Validate required fields
    if (!restaurantSlug || !billNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: restaurantSlug and billNumber are required' 
      });
    }

    // Validate ratings
    const ratings = [serviceRating, foodRating, cleanlinessRating];
    for (let rating of ratings) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false,
          error: 'Ratings must be between 1 and 5' 
        });
      }
    }

    // Calculate overall rating
    const overallRating = (serviceRating + foodRating + cleanlinessRating) / 3;

    // Get restaurant details
    let restaurantName = 'Restaurant';
    let restaurantCode = 'REST001';
    
    if (Restaurant) {
      try {
        const restaurant = await Restaurant.findOne({ restaurantSlug });
        if (restaurant) {
          restaurantName = restaurant.restaurantName;
          restaurantCode = restaurant.restaurantCode;
        }
      } catch (error) {
        console.log('⚠️ Could not fetch restaurant details:', error.message);
      }
    }

    // Get order details if available
    let orderDate = new Date().toISOString().split('T')[0];
    let orderTime = new Date().toLocaleTimeString();
    let finalCustomerName = customerName;
    let finalTableNumber = tableNumber;

    if (Order && restaurantCode && billNumber) {
      try {
        // Find order by restaurantCode and billNumber (as per your orderModel)
        const order = await Order.findOne({ 
          restaurantCode, 
          billNumber 
        });
        
        if (order) {
          orderDate = order.date || orderDate;
          orderTime = order.time || orderTime;
          finalCustomerName = order.customerName || finalCustomerName;
          finalTableNumber = order.tableNumber || finalTableNumber;
        }
      } catch (error) {
        console.log('⚠️ Could not fetch order details:', error.message);
      }
    }

    // Check if feedback already exists for this bill
    const existingFeedback = await Feedback.findOne({ 
      restaurantCode, 
      billNumber 
    });
    
    if (existingFeedback) {
      return res.status(400).json({ 
        success: false,
        error: 'Feedback already submitted for this bill' 
      });
    }

    // Create feedback
    const feedback = new Feedback({
      restaurantSlug,
      restaurantCode,
      restaurantName,
      orderId: orderId || null,
      billNumber,
      customerName: finalCustomerName,
      tableNumber: finalTableNumber,
      orderDate,
      orderTime,
      serviceRating,
      foodRating,
      cleanlinessRating,
      overallRating: parseFloat(overallRating.toFixed(1)),
      comments: comments || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      status: 'pending'
    });

    await feedback.save();

    console.log('✅ Feedback submitted successfully for bill:', billNumber);

    // Update order with feedback reference if Order model exists
    if (Order && restaurantCode && billNumber) {
      try {
        await Order.findOneAndUpdate(
          { restaurantCode, billNumber },
          { $set: { feedbackId: feedback._id } }
        );
      } catch (error) {
        console.log('⚠️ Could not update order with feedback reference:', error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        billNumber: feedback.billNumber,
        restaurantName: feedback.restaurantName,
        ratings: {
          service: feedback.serviceRating,
          food: feedback.foodRating,
          cleanliness: feedback.cleanlinessRating,
          overall: feedback.overallRating
        },
        submittedAt: feedback.submittedAt
      }
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
};

// Get feedback for a specific restaurant
exports.getFeedbackByRestaurant = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { restaurantSlug };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Found ${feedback.length} feedback records for ${restaurantSlug}`);

    res.json({
      success: true,
      feedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get feedback for a specific order/bill
exports.getFeedbackByOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;

    const feedback = await Feedback.findOne({ 
      restaurantCode, 
      billNumber 
    }).select('-__v');

    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'No feedback found for this order' 
      });
    }

    res.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('❌ Error fetching order feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get feedback statistics for a restaurant
exports.getFeedbackStats = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;

    // Get all feedback for the restaurant
    const allFeedback = await Feedback.find({ restaurantSlug });
    
    if (allFeedback.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalFeedback: 0,
          avgServiceRating: 0,
          avgFoodRating: 0,
          avgCleanlinessRating: 0,
          avgOverallRating: 0,
          statusCounts: {
            pending: 0,
            reviewed: 0,
            resolved: 0,
            archived: 0
          },
          ratingDistribution: {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
          }
        }
      });
    }

    // Calculate statistics
    const total = allFeedback.length;
    const avgServiceRating = allFeedback.reduce((sum, fb) => sum + fb.serviceRating, 0) / total;
    const avgFoodRating = allFeedback.reduce((sum, fb) => sum + fb.foodRating, 0) / total;
    const avgCleanlinessRating = allFeedback.reduce((sum, fb) => sum + fb.cleanlinessRating, 0) / total;
    const avgOverallRating = allFeedback.reduce((sum, fb) => sum + fb.overallRating, 0) / total;

    // Count by status
    const statusCounts = {
      pending: allFeedback.filter(fb => fb.status === 'pending').length,
      reviewed: allFeedback.filter(fb => fb.status === 'reviewed').length,
      resolved: allFeedback.filter(fb => fb.status === 'resolved').length,
      archived: allFeedback.filter(fb => fb.status === 'archived').length
    };

    // Rating distribution
    const ratingDistribution = {
      '1': allFeedback.filter(fb => Math.round(fb.overallRating) === 1).length,
      '2': allFeedback.filter(fb => Math.round(fb.overallRating) === 2).length,
      '3': allFeedback.filter(fb => Math.round(fb.overallRating) === 3).length,
      '4': allFeedback.filter(fb => Math.round(fb.overallRating) === 4).length,
      '5': allFeedback.filter(fb => Math.round(fb.overallRating) === 5).length
    };

    res.json({
      success: true,
      stats: {
        totalFeedback: total,
        avgServiceRating: parseFloat(avgServiceRating.toFixed(1)),
        avgFoodRating: parseFloat(avgFoodRating.toFixed(1)),
        avgCleanlinessRating: parseFloat(avgCleanlinessRating.toFixed(1)),
        avgOverallRating: parseFloat(avgOverallRating.toFixed(1)),
        statusCounts,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get recent feedback
exports.getRecentFeedback = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { limit = 10 } = req.query;

    const recentFeedback = await Feedback.find({ restaurantSlug })
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .select('billNumber customerName overallRating comments submittedAt status restaurantResponse restaurantName');

    res.json({
      success: true,
      feedback: recentFeedback
    });

  } catch (error) {
    console.error('❌ Error fetching recent feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Update feedback status
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid status required: pending, reviewed, resolved, or archived' 
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        error: 'Feedback not found' 
      });
    }

    feedback.status = status;
    feedback.updatedAt = Date.now();
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      feedback: {
        id: feedback._id,
        status: feedback.status,
        updatedAt: feedback.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Add restaurant response to feedback
exports.addRestaurantResponse = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { response } = req.body;

    if (!response || response.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Response text is required' 
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        error: 'Feedback not found' 
      });
    }

    feedback.restaurantResponse = response.trim();
    feedback.respondedAt = Date.now();
    feedback.status = 'resolved';
    await feedback.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      feedback: {
        id: feedback._id,
        restaurantResponse: feedback.restaurantResponse,
        respondedAt: feedback.respondedAt,
        status: feedback.status
      }
    });

  } catch (error) {
    console.error('❌ Error adding response:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get all feedback (for admin dashboard)
exports.getAllFeedback = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      restaurant,
      status,
      startDate,
      endDate,
      minRating
    } = req.query;

    // Build query
    const query = {};
    
    if (restaurant && restaurant !== 'all') {
      query.restaurantSlug = restaurant;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (minRating) {
      query.overallRating = { $gte: parseFloat(minRating) };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count
    const total = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get unique restaurants for filter
    const restaurants = await Feedback.distinct('restaurantName', query);

    res.json({
      success: true,
      feedback,
      filters: {
        restaurants,
        totalItems: total
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get feedback summary (for dashboard cards)
exports.getFeedbackSummary = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;

    // Get counts by status
    const counts = await Feedback.aggregate([
      {
        $match: restaurantSlug ? { restaurantSlug } : {}
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average ratings
    const avgRatings = await Feedback.aggregate([
      {
        $match: restaurantSlug ? { restaurantSlug } : {}
      },
      {
        $group: {
          _id: null,
          avgService: { $avg: '$serviceRating' },
          avgFood: { $avg: '$foodRating' },
          avgCleanliness: { $avg: '$cleanlinessRating' },
          avgOverall: { $avg: '$overallRating' },
          total: { $sum: 1 }
        }
      }
    ]);

    // Get recent feedback
    const recentFeedback = await Feedback.find(restaurantSlug ? { restaurantSlug } : {})
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('billNumber customerName overallRating comments submittedAt');

    // Format response
    const statusCounts = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      archived: 0
    });

    const averages = avgRatings[0] || {
      avgService: 0,
      avgFood: 0,
      avgCleanliness: 0,
      avgOverall: 0,
      total: 0
    };

    res.json({
      success: true,
      summary: {
        total: averages.total,
        averages: {
          service: parseFloat(averages.avgService?.toFixed(1) || 0),
          food: parseFloat(averages.avgFood?.toFixed(1) || 0),
          cleanliness: parseFloat(averages.avgCleanliness?.toFixed(1) || 0),
          overall: parseFloat(averages.avgOverall?.toFixed(1) || 0)
        },
        statusCounts,
        recentFeedback
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Export feedback as CSV
exports.exportFeedback = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { format = 'csv', startDate, endDate } = req.query;

    // Build query
    const query = restaurantSlug ? { restaurantSlug } : {};
    if (startDate && endDate) {
      query.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .select('-__v');

    if (feedback.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No feedback found for export' 
      });
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Restaurant Name', 'Restaurant Code', 'Bill Number', 'Customer Name',
        'Table', 'Order Date', 'Order Time', 'Service Rating', 'Food Rating',
        'Cleanliness Rating', 'Overall Rating', 'Comments', 'Status',
        'Submitted At', 'Restaurant Response', 'Customer Email', 'Customer Phone'
      ];

      const csvRows = feedback.map(item => [
        `"${item.restaurantName}"`,
        item.restaurantCode,
        item.billNumber,
        `"${item.customerName}"`,
        item.tableNumber,
        item.orderDate,
        item.orderTime,
        item.serviceRating,
        item.foodRating,
        item.cleanlinessRating,
        item.overallRating,
        `"${(item.comments || '').replace(/"/g, '""')}"`,
        item.status,
        new Date(item.submittedAt).toLocaleString(),
        `"${(item.restaurantResponse || '').replace(/"/g, '""')}"`,
        item.customerEmail || '',
        item.customerPhone || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=feedback_${restaurantSlug || 'all'}_${Date.now()}.csv`);
      res.send(csvContent);

    } else {
      // Return as JSON
      res.json({
        success: true,
        restaurantSlug: restaurantSlug || 'all',
        totalFeedback: feedback.length,
        feedback
      });
    }

  } catch (error) {
    console.error('❌ Error exporting feedback:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// Get feedback by date range
exports.getFeedbackByDateRange = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const query = restaurantSlug ? { restaurantSlug } : {};
    query.submittedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    const feedback = await Feedback.find(query)
      .sort({ submittedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      feedback,
      total: feedback.length,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback by date range:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};