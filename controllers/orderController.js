const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Counter = require('../models/counterModel');
const jwt = require('jsonwebtoken');

// =========== VERIFY RESTAURANT ACCESS ===========
exports.verifyRestaurantAccess = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log(`🔐 Verifying access for restaurant: ${restaurantSlug}`);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication token required' 
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'restaurant-secret-key-2024');
      console.log('✅ Token verified, user:', decoded.userId || decoded.id);
    } catch (jwtError) {
      console.log('❌ Token verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }
    
    // Extract user info from token
    const user = {
      id: decoded.userId || decoded.id || 'user-123',
      name: decoded.name || decoded.username || 'User',
      email: decoded.email || 'user@example.com',
      role: decoded.role || 'owner',
      phone: decoded.phone || ''
    };
    
    // Try to find restaurant from orders database
    try {
      // Look for orders with this restaurant slug
      const sampleOrder = await Order.findOne({ 
        $or: [
          { restaurantSlug: restaurantSlug },
          { restaurantCode: restaurantSlug }
        ]
      }).sort({ createdAt: -1 }).limit(1);
      
      if (sampleOrder) {
        console.log('✅ Restaurant found in orders:', sampleOrder.restaurantName);
        
        return res.status(200).json({
          success: true,
          restaurant: {
            name: sampleOrder.restaurantName,
            code: sampleOrder.restaurantCode,
            slug: sampleOrder.restaurantSlug,
            gstNumber: sampleOrder.gstNumber || `GSTIN${sampleOrder.restaurantCode}`
          },
          user: user
        });
      }
      
      // If no orders found, create a mock restaurant based on slug
      console.log('⚠️ No orders found, creating mock restaurant from slug');
      
      const restaurantName = restaurantSlug.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      res.status(200).json({
        success: true,
        restaurant: {
          name: restaurantName,
          code: restaurantSlug.toUpperCase(),
          slug: restaurantSlug,
          gstNumber: `GSTIN${restaurantSlug.toUpperCase()}`
        },
        user: user,
        note: 'Restaurant info derived from slug'
      });
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      
      // Fallback: use token data
      res.status(200).json({
        success: true,
        restaurant: {
          name: decoded.restaurantName || restaurantSlug,
          code: decoded.restaurantCode || restaurantSlug.toUpperCase(),
          slug: restaurantSlug,
          gstNumber: decoded.gstNumber || `GSTIN${restaurantSlug.toUpperCase()}`
        },
        user: user,
        note: 'Using token data for restaurant info'
      });
    }
    
  } catch (err) {
    console.error('❌ Error verifying restaurant access:', err);
    
    res.status(500).json({ 
      success: false,
      error: 'Server error while verifying access',
      message: err.message 
    });
  }
};

// =========== GET RESTAURANT ORDERS WITH ANALYTICS ===========
exports.getRestaurantOrdersAnalytics = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { startDate, endDate, page = 1, limit = 100 } = req.query;
    
    console.log(`📊 Getting analytics for restaurant: ${restaurantSlug}`);
    
    // Build query
    let query = { 
      $or: [
        { restaurantSlug: restaurantSlug },
        { restaurantCode: restaurantSlug }
      ]
    };
    
    // Date filtering
    if (startDate && endDate) {
      query.date = { 
        $gte: startDate, 
        $lte: endDate 
      };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get orders
    const orders = await Order.find(query)
      .sort({ date: -1, billNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalOrders = await Order.countDocuments(query);
    
    // Calculate analytics
    const analytics = {
      totalOrders: totalOrders,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalGST: orders.reduce((sum, order) => sum + (order.gstAmount || 0), 0),
      totalItems: orders.reduce((sum, order) => sum + (order.items?.length || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      avgOrderValue: totalOrders > 0 
        ? orders.reduce((sum, order) => sum + (order.total || 0), 0) / totalOrders 
        : 0,
      byDate: {},
      topItems: {}
    };
    
    // Group by date
    orders.forEach(order => {
      if (!analytics.byDate[order.date]) {
        analytics.byDate[order.date] = {
          orders: 0,
          revenue: 0,
          items: 0
        };
      }
      analytics.byDate[order.date].orders++;
      analytics.byDate[order.date].revenue += order.total || 0;
      analytics.byDate[order.date].items += order.items?.length || 0;
      
      // Count items
      if (order.items) {
        order.items.forEach(item => {
          if (!analytics.topItems[item.name]) {
            analytics.topItems[item.name] = {
              quantity: 0,
              revenue: 0
            };
          }
          analytics.topItems[item.name].quantity += item.quantity || 0;
          analytics.topItems[item.name].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });
    
    // Convert topItems to array and sort
    analytics.topItemsArray = Object.entries(analytics.topItems)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
    
    console.log(`✅ Found ${orders.length} orders for analytics`);
    
    res.status(200).json({
      success: true,
      restaurantSlug,
      orders: orders,
      analytics: analytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit)
      }
    });
    
  } catch (err) {
    console.error('❌ Error getting restaurant analytics:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
};

// =========== CREATE ORDER (UPDATED - Added customerPhone and payment fields) ===========
exports.createOrder = async (req, res) => {
  try {
    console.log('🟢 CREATE ORDER REQUEST RECEIVED');
    console.log('📦 Request body:', req.body);
    
    const { 
      restaurantCode,
      restaurantName,
      restaurantSlug,
      customerName,
      customerPhone,
      customerEmail,
      tableNumber, 
      items,
      gstNumber,
      gstPercentage = 18,
      paymentMethod = 'pending',
      paymentStatus = 'pending'
    } = req.body;

    console.log('📞 Customer phone received:', customerPhone);
    console.log('💳 Payment method received:', paymentMethod);
    console.log('💰 Payment status received:', paymentStatus);

    const now = new Date();
    const date = req.body.date || now.toISOString().split('T')[0];
    const time = req.body.time || now.toTimeString().split(' ')[0];

    if (!restaurantCode) {
      return res.status(400).json({ error: 'Restaurant code is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Get bill number
    let billNumber;
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: restaurantCode },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: { _id: restaurantCode, restaurantCode: restaurantCode, sequence_value: 1 } }
      );
      billNumber = counter.sequence_value;
      console.log(`📊 Counter-based bill number: ${billNumber}`);
    } catch (counterError) {
      const maxOrder = await Order.findOne({ restaurantCode }).sort({ billNumber: -1 }).select('billNumber').lean();
      billNumber = maxOrder ? maxOrder.billNumber + 1 : 1;
    }

    // Calculate order totals
    let subtotal = 0;
    let totalGst = 0;
    let rollNumber = 1;

    const sanitizedItems = items.map(item => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      const itemGst = itemTotal * (gstPercentage / 100);
      subtotal += itemTotal;
      totalGst += itemGst;
      return {
        itemId: item.itemId || new mongoose.Types.ObjectId(),
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        category: item.category,
        type: item.type,
        gstPercentage: gstPercentage,
        total: itemTotal,
        itemStatus: 'pending',
        rollNumber: rollNumber++
      };
    });

    const total = subtotal + totalGst;
    
    console.log('💰 Calculated totals:', { subtotal, totalGst, total });
    console.log('📞 Customer phone saved:', customerPhone);
    console.log('💳 Payment method saved:', paymentMethod, 'Payment status:', paymentStatus);

    const anyPending = sanitizedItems.some(item => item.itemStatus === 'pending');
    let orderStatus = anyPending ? 'pending' : 'preparing';

    const newOrder = new Order({
      restaurantCode,
      restaurantName: restaurantName || restaurantCode,
      restaurantSlug: restaurantSlug || restaurantCode.toLowerCase(),
      date, time,
      gstNumber: gstNumber || `GSTIN${restaurantCode}`,
      gstPercentage,
      billNumber,
      customerName: customerName || 'Guest',
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      tableNumber: tableNumber || '0',
      items: sanitizedItems,
      subtotal,
      discount: 0,
      gstAmount: totalGst,
      total,
      orderStatus,
      paymentMethod,
      paymentStatus,
      nextRollNumber: rollNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newOrder.save();
    console.log('✅ Order saved successfully. ID:', newOrder._id);
    console.log('✅ Customer phone saved in DB:', newOrder.customerPhone);
    console.log('✅ Payment method saved in DB:', newOrder.paymentMethod);
    
    res.status(201).json({ success: true, message: 'Order created successfully', order: newOrder });
    
  } catch (err) {
    console.error('❌ Error creating order:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message });
  }
};

// =========== GET ORDER BY ID ===========
// =========== GET ORDER BY ID ===========
// =========== GET ORDER BY ID ===========
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('🔍 Getting order by ID:', orderId);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log('❌ Invalid ObjectId format:', orderId);
      return res.status(400).json({ error: 'Invalid order ID format' });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log('✅ Order found by ID:', order._id);
    console.log('💰 Payment status:', order.paymentStatus);
    res.status(200).json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
};

//// =========== UPDATE ORDER ===========
//exports.updateOrder = async (req, res) => {
//  try {
//    const { orderId } = req.params;
//    const updateData = req.body;
//    updateData.updatedAt = new Date();
//    const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
//    if (!order) {
//      return res.status(404).json({ error: 'Order not found' });
//    }
//    res.status(200).json({ success: true, order });
//  } catch (err) {
//    console.error('Error updating order:', err);
//    res.status(500).json({ error: 'Server error' });
//  }
//};

// =========== ADD ITEM TO ORDER ===========
exports.addItemToOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const item = req.body;
    
    const order = await Order.findOne({ restaurantCode, billNumber: Number(billNumber) });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
    const newItem = {
      itemId: new mongoose.Types.ObjectId(),
      name: item.name,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      category: item.category || '',
      type: item.type || 'Veg',
      gstPercentage: item.gstPercentage || order.gstPercentage || 18,
      total: itemTotal,
      itemStatus: 'pending',
      rollNumber: order.items.length + 1
    };
    
    order.items.push(newItem);
    order.subtotal += itemTotal;
    order.gstAmount += itemTotal * (order.gstPercentage / 100);
    order.total = order.subtotal + order.gstAmount;
    order.paymentStatus = 'pending';
    order.updatedAt = new Date();
    await order.save();
    
    res.status(200).json({ success: true, message: 'Item added successfully', order });
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// =========== REMOVE ITEM FROM ORDER ===========
exports.removeItemFromOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber, itemId } = req.params;
    
    const order = await Order.findOne({ restaurantCode, billNumber: Number(billNumber) });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId || item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    const itemToRemove = order.items[itemIndex];
    const itemTotal = itemToRemove.total || (itemToRemove.price * itemToRemove.quantity);
    
    order.items.splice(itemIndex, 1);
    order.subtotal -= itemTotal;
    order.gstAmount = order.subtotal * (order.gstPercentage / 100);
    order.total = order.subtotal + order.gstAmount;
    
    if (order.items.length === 0) {
      order.orderStatus = 'cancelled';
      order.paymentStatus = 'pending';
    }
    
    order.updatedAt = new Date();
    await order.save();
    
    res.status(200).json({ success: true, message: 'Item removed successfully', order });
  } catch (err) {
    console.error('Error removing item:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

//// =========== GET ORDER BY RESTAURANT AND BILL ===========
//exports.getOrderByRestaurantAndBill = async (req, res) => {
//  try {
//    const { restaurantCode, billNumber } = req.params;
//    const order = await Order.findOne({ restaurantCode, billNumber: Number(billNumber) });
//    if (!order) {
//      return res.status(404).json({ error: `Order #${billNumber} not found` });
//    }
//    res.status(200).json(order);
//  } catch (err) {
//    console.error('Error fetching order:', err);
//    res.status(500).json({ error: 'Server error' });
//  }
//};

// =========== TEST ENDPOINT ===========
exports.testEndpoint = async (req, res) => {
  res.status(200).json({ message: 'Order Controller is working', timestamp: new Date().toISOString() });
};

// =========== GET ORDERS BY RESTAURANT CODE ===========
exports.getOrdersByRestaurantCode = async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    console.log('🔍 Getting orders for:', restaurantCode);
    
    const orders = await Order.find({ restaurantCode })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${orders.length} orders for ${restaurantCode}`);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching restaurant orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== GET ORDER BY RESTAURANT CODE AND BILL NUMBER ===========
exports.getOrderByRestaurantAndBill = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    console.log(`🔍 Getting order: ${restaurantCode} #${billNumber}`);
    
    const order = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ 
        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
      });
    }

    console.log('✅ Order found:', order._id);
    res.status(200).json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== UPDATE ORDER (FIXED - Recalculates order status) ===========
exports.updateOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const updateData = req.body;

    console.log(`🔄 Updating order: ${restaurantCode} #${billNumber}`);
    console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));

    const existingOrder = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });

    if (!existingOrder) {
      console.log('❌ Order not found');
      return res.status(404).json({ 
        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
      });
    }

    if (updateData.items && Array.isArray(updateData.items)) {
      console.log('🔄 Processing items update...');
      
      let nextRollNumber = 1;
      const updatedItems = [];
      
      // Process each item from the update
      updateData.items.forEach((newItem, index) => {
        console.log(`📝 Processing item ${index + 1}:`, newItem.name);
        
        // Preserve existing item status if it exists in the old order
        let itemStatus = 'pending';
        const existingItem = existingOrder.items.find(
          item => item.itemId?.toString() === newItem.itemId || item._id?.toString() === newItem.itemId
        );
        if (existingItem) {
          itemStatus = existingItem.itemStatus;
        }
        
        const itemToAdd = {
          itemId: newItem.itemId || new mongoose.Types.ObjectId(),
          name: newItem.name,
          quantity: Number(newItem.quantity),
          price: Number(newItem.price),
          category: newItem.category || '',
          type: newItem.type || 'Veg',
          gstPercentage: Number(newItem.gstPercentage) || 18,
          total: Number(newItem.price) * Number(newItem.quantity),
          itemStatus: itemStatus,
          rollNumber: index + 1
        };
        
        updatedItems.push(itemToAdd);
      });
      
      // Calculate totals from updated items
      const subtotal = updatedItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );
      
      const gstAmount = updatedItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity * (item.gstPercentage || 18) / 100);
      }, 0);
      
      const total = subtotal + gstAmount;
      
      const discount = updateData.discount !== undefined ? Number(updateData.discount) : existingOrder.discount || 0;
      const discountType = updateData.discountType || existingOrder.discountType || 'amount';
      
      let discountedTotal = total;
      if (discount > 0) {
        if (discountType === 'percentage') {
          const validDiscount = Math.min(Math.max(discount, 0), 100);
          const discountAmount = total * (validDiscount / 100);
          discountedTotal = Math.max(0, total - discountAmount);
        } else {
          const validDiscount = Math.min(Math.max(discount, 0), total);
          discountedTotal = Math.max(0, total - validDiscount);
        }
      }
      
      // CRITICAL: Determine order status based on items
      const anyPending = updatedItems.some(item => item.itemStatus === 'pending');
      const anyPreparing = updatedItems.some(item => item.itemStatus === 'preparing');
      const allCompleted = updatedItems.every(item => item.itemStatus === 'completed');
      
      let orderStatus = existingOrder.status;
      if (anyPending) {
        orderStatus = 'pending';
        console.log('📊 Has pending items → Order status: PENDING');
      } else if (anyPreparing) {
        orderStatus = 'preparing';
        console.log('📊 Has preparing items → Order status: PREPARING');
      } else if (allCompleted && updatedItems.length > 0) {
        orderStatus = 'completed';
        console.log('📊 All items completed → Order status: COMPLETED');
      }
      
      // Use status from updateData if provided (for billing staff override)
      if (updateData.status) {
        orderStatus = updateData.status;
      }
      
      const updateObject = {
        items: updatedItems,
        subtotal: Number(subtotal.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType: discountType,
        discountedTotal: Number(discountedTotal.toFixed(2)),
        nextRollNumber: updatedItems.length + 1,
        orderStatus: orderStatus,  // Use orderStatus field
        status: orderStatus,       // Also set status for compatibility
        customerName: updateData.customerName || existingOrder.customerName,
        tableNumber: updateData.tableNumber || existingOrder.tableNumber,
        updatedAt: new Date()
      };
      
      console.log('💾 Saving order with status:', orderStatus);
      
      const updatedOrder = await Order.findOneAndUpdate(
        { restaurantCode, billNumber: Number(billNumber) },
        { $set: updateObject },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Order updated successfully');
      console.log('📊 New order status:', updatedOrder.orderStatus || updatedOrder.status);
      
      res.status(200).json({ 
        message: 'Order updated successfully', 
        order: updatedOrder 
      });
      
    } else {
      // For non-items update
      const updateObject = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const updatedOrder = await Order.findOneAndUpdate(
        { restaurantCode, billNumber: Number(billNumber) },
        { $set: updateObject },
        { new: true, runValidators: true }
      );
      
      res.status(200).json({ 
        message: 'Order updated successfully', 
        order: updatedOrder 
      });
    }
    
  } catch (err) {
    console.error('❌ Error updating order:', err);
    res.status(500).json({ 
      error: 'Failed to update order',
      message: err.message 
    });
  }
};
// =========== DELETE ORDER ===========
exports.deleteOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    console.log(`🗑️ Deleting order: ${restaurantCode} #${billNumber}`);
    
    const deletedOrder = await Order.findOneAndDelete({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });
    
    if (!deletedOrder) {
      console.log('❌ Order not found');
      return res.status(404).json({ 
        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
      });
    }

    console.log('✅ Order deleted successfully');
    
    res.status(200).json({ 
      message: `Order #${billNumber} deleted successfully`,
      deletedOrder 
    });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

// =========== GET TODAY'S ORDERS ===========
exports.getTodaysOrders = async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 Getting today's orders for ${restaurantCode}: ${today}`);
    
    const orders = await Order.find({
      restaurantCode,
      date: today
    }).sort({ billNumber: -1 });

    console.log(`✅ Found ${orders.length} orders for today`);
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching today\'s orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== UPDATE ORDER STATUS ===========
exports.updateOrderStatus = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { restaurantCode, billNumber: Number(billNumber) },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ 
        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
      });
    }

    res.status(200).json({ 
      message: 'Order status updated successfully', 
      order: updatedOrder 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// =========== UPDATE ITEM STATUS ===========
//exports.updateItemStatus = async (req, res) => {
//  try {
//    const { restaurantCode, billNumber } = req.params;
//    const { itemId, itemStatus } = req.body;
//
//    console.log(`🔄 Updating item ${itemId} to ${itemStatus} in order ${billNumber}`);
//
//    if (!['pending', 'preparing', 'completed'].includes(itemStatus)) {
//      return res.status(400).json({ error: 'Invalid item status value' });
//    }
//
//    const order = await Order.findOne({ 
//      restaurantCode, 
//      billNumber: Number(billNumber) 
//    });
//    
//    if (!order) {
//      return res.status(404).json({ 
//        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
//      });
//    }
//
//    // Find and update the item
//    const item = order.items.id(itemId);
//    if (!item) {
//      return res.status(404).json({ error: 'Item not found in order' });
//    }
//
//    item.itemStatus = itemStatus;
//
//    // Recalculate order status based on ALL items
//    const allItems = order.items;
//    const anyPending = allItems.some(item => item.itemStatus === 'pending');
//    const anyPreparing = allItems.some(item => item.itemStatus === 'preparing');
//    const allCompleted = allItems.every(item => item.itemStatus === 'completed');
//
//    // Order status logic:
//    // - If ANY item is pending -> order is pending (highest priority)
//    // - Else if ANY item is preparing -> order is preparing
//    // - Else if ALL items are completed -> order is completed
//    if (anyPending) {
//      order.status = 'pending';
//    } else if (anyPreparing) {
//      order.status = 'preparing';
//    } else if (allCompleted) {
//      order.status = 'completed';
//    }
//
//    await order.save();
//
//    console.log('✅ Item status updated successfully');
//    console.log('📊 New order status:', order.status);
//    console.log('📊 Item statuses:', allItems.map(i => ({ name: i.name, status: i.itemStatus })));
//
//    res.status(200).json({ 
//      message: 'Item status updated successfully', 
//      order: order 
//    });
//  } catch (err) {
//    console.error('Error updating item status:', err);
//    res.status(500).json({ error: 'Failed to update item status' });
//  }
//};



// =========== UPDATE ITEM STATUS (FIXED - Using orderStatus field) ===========
exports.updateItemStatus = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const { itemId, itemStatus } = req.body;

    console.log(`🔄 Updating item ${itemId} to ${itemStatus} in order ${billNumber}`);

    if (!['pending', 'preparing', 'completed'].includes(itemStatus)) {
      return res.status(400).json({ error: 'Invalid item status value' });
    }

    // Find the order
    const order = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: `Order #${billNumber} not found for restaurant ${restaurantCode}` 
      });
    }

    console.log('📊 Current order status (orderStatus):', order.orderStatus);
    console.log('📊 Current items:', order.items.map(i => ({ name: i.name, status: i.itemStatus })));

    // Find and update the specific item
    let itemFound = false;
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      if (item._id.toString() === itemId || item.itemId.toString() === itemId) {
        item.itemStatus = itemStatus;
        itemFound = true;
        console.log(`✅ Updated item "${item.name}" to ${itemStatus}`);
        break;
      }
    }

    if (!itemFound) {
      return res.status(404).json({ error: 'Item not found in order' });
    }

    // Check ALL items status
    const allItems = order.items;
    const pendingItems = allItems.filter(item => item.itemStatus === 'pending');
    const preparingItems = allItems.filter(item => item.itemStatus === 'preparing');
    const completedItems = allItems.filter(item => item.itemStatus === 'completed');
    
    console.log('📊 Status counts:', {
      pending: pendingItems.length,
      preparing: preparingItems.length,
      completed: completedItems.length,
      total: allItems.length
    });

    // Determine new order status (using orderStatus field)
    let newStatus = order.orderStatus;
    
    if (pendingItems.length > 0) {
      newStatus = 'pending';
      console.log('⏳ Has pending items → Order status: PENDING');
    } else if (preparingItems.length > 0) {
      newStatus = 'preparing';
      console.log('👨‍🍳 Has preparing items → Order status: PREPARING');
    } else if (completedItems.length === allItems.length && allItems.length > 0) {
      newStatus = 'completed';
      console.log('✅ ALL items completed → Order status: COMPLETED');
    }

    // Update order status if changed (using orderStatus)
    if (newStatus !== order.orderStatus) {
      order.orderStatus = newStatus;
      console.log(`🔄 Order status changed from ${order.orderStatus} to ${newStatus}`);
    }

    order.updatedAt = new Date();
    
    // Save the order
    const savedOrder = await order.save();
    
    console.log('💾 Order saved! Final orderStatus:', savedOrder.orderStatus);
    console.log('📊 Final items:', savedOrder.items.map(i => ({ name: i.name, status: i.itemStatus })));

    // Return success with updated order
    res.status(200).json({ 
      success: true,
      message: 'Item status updated successfully',
      order: {
        _id: savedOrder._id,
        billNumber: savedOrder.billNumber,
        orderStatus: savedOrder.orderStatus,
        status: savedOrder.orderStatus, // Also send as status for frontend compatibility
        items: savedOrder.items.map(item => ({
          _id: item._id,
          name: item.name,
          itemStatus: item.itemStatus
        }))
      },
      orderStatus: savedOrder.orderStatus
    });
    
  } catch (err) {
    console.error('❌ Error updating item status:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update item status',
      message: err.message 
    });
  }
};
// =========== GET ORDER STATISTICS ===========
exports.getOrderStatistics = async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    const { date } = req.query;
    
    let query = { restaurantCode };
    
    if (date) {
      query.date = date;
    } else {
      const today = new Date().toISOString().split('T')[0];
      query.date = today;
    }

    const orders = await Order.find(query);
    
    const statistics = {
      totalOrders: orders.length,
      totalItems: orders.reduce((sum, order) => sum + order.items.length, 0),
      pendingItems: orders.reduce((sum, order) => 
        sum + order.items.filter(item => item.itemStatus === 'pending').length, 0
      ),
      preparingItems: orders.reduce((sum, order) => 
        sum + order.items.filter(item => item.itemStatus === 'preparing').length, 0
      ),
      completedItems: orders.reduce((sum, order) => 
        sum + order.items.filter(item => item.itemStatus === 'completed').length, 0
      ),
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      ordersByStatus: {
        pending: orders.filter(order => order.status === 'pending').length,
        preparing: orders.filter(order => order.status === 'preparing').length,
        completed: orders.filter(order => order.status === 'completed').length
      }
    };

    res.status(200).json(statistics);
  } catch (err) {
    console.error('Error fetching order statistics:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== GET LATEST BILL NUMBER ===========
exports.getLatestBillNumber = async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    
    const counter = await Counter.findOne({ 
      _id: 'billNumber', 
      restaurantCode 
    });
    
    const nextBillNumber = counter ? counter.sequence_value + 1 : 1;
    
    res.status(200).json({ 
      restaurantCode, 
      nextBillNumber 
    });
  } catch (err) {
    console.error('Error fetching latest bill number:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== SEARCH ORDERS ===========
exports.searchOrders = async (req, res) => {
  try {
    const { restaurantCode } = req.params;
    const { query, date } = req.query;
    
    let searchQuery = { restaurantCode };
    
    if (date) {
      searchQuery.date = date;
    }
    
    if (query) {
      searchQuery.$or = [
        { customerName: { $regex: query, $options: 'i' } },
        { 'items.name': { $regex: query, $options: 'i' } },
        { billNumber: isNaN(query) ? -1 : Number(query) }
      ].filter(condition => condition);
    }

    const orders = await Order.find(searchQuery)
      .sort({ date: -1, billNumber: -1 })
      .limit(100);

    res.status(200).json(orders);
  } catch (err) {
    console.error('Error searching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// =========== GET KITCHEN ORDERS ===========
exports.getKitchenOrders = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`👨‍🍳 Getting kitchen orders for restaurant slug: ${restaurantSlug} - ${today}`);
    
    const orders = await Order.find({
      $or: [
        { restaurantSlug: restaurantSlug },
        { restaurantCode: restaurantSlug }
      ],
      date: today,
      status: { $ne: 'cancelled' }
    })
    .sort({ billNumber: 1 })
    .lean();

    console.log(`✅ Found ${orders.length} orders for kitchen display`);
    
    res.status(200).json({
      success: true,
      restaurantSlug: restaurantSlug,
      date: today,
      orders: orders || [],
      count: orders ? orders.length : 0
    });
  } catch (err) {
    console.error('Error fetching kitchen orders:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
};

// =========== GET BILLING ORDERS ===========
exports.getBillingOrders = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`💰 Getting billing orders for: ${restaurantSlug}`);
    
    const orders = await Order.find({
      restaurantSlug: restaurantSlug,
      date: today,
      status: { $ne: 'cancelled' }
    })
    .sort({ billNumber: 1 })
    .lean();

    console.log(`✅ Found ${orders.length} orders for billing`);
    
    res.status(200).json({
      success: true,
      restaurantSlug: restaurantSlug,
      date: today,
      orders: orders || [],
      count: orders ? orders.length : 0
    });
    
  } catch (err) {
    console.error('❌ Error fetching billing orders:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
};

// =========== APPLY DISCOUNT TO ORDER ===========
exports.applyOrderDiscount = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const { discount, discountType = 'amount' } = req.body;
    
    console.log(`🎫 Applying discount to order ${billNumber}:`, { discount, discountType });
    
    const order = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    order.discount = parseFloat(discount) || 0;
    order.discountType = discountType;
    
    let discountedTotal = order.total;
    if (order.discount > 0) {
      if (discountType === 'percentage') {
        const maxDiscount = Math.min(order.discount, 100);
        const discountAmount = order.total * (maxDiscount / 100);
        discountedTotal = Math.max(0, order.total - discountAmount);
      } else {
        const maxDiscount = Math.min(order.discount, order.total);
        discountedTotal = Math.max(0, order.total - maxDiscount);
      }
    }
    
    order.discountedTotal = discountedTotal;
    await order.save();
    
    console.log('✅ Discount applied successfully');
    
    res.status(200).json({
      success: true,
      message: 'Discount applied successfully',
      order: order
    });
    
  } catch (err) {
    console.error('❌ Error applying discount:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to apply discount',
      message: err.message 
    });
  }
};

// =========== ADD ITEM TO ORDER (FIXED - Updates order status) ===========
exports.addItemToOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber } = req.params;
    const item = req.body;
    
    console.log(`➕ Adding item to order ${billNumber}:`, item);
    
    if (!item.name || item.price <= 0 || item.quantity <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Item name, price, and quantity are required' 
      });
    }
    
    const order = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
    const itemGst = itemTotal * (item.gstPercentage || order.gstPercentage || 18) / 100;
    
    const newItem = {
      itemId: new mongoose.Types.ObjectId(),
      name: item.name,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
      category: item.category || '',
      type: item.type || 'Veg',
      gstPercentage: item.gstPercentage || order.gstPercentage || 18,
      total: itemTotal,
      itemStatus: 'pending',  // New items always start as pending
      rollNumber: order.items.length + 1
    };
    
    order.items.push(newItem);
    
    // Recalculate totals
    order.subtotal += itemTotal;
    order.gstAmount += itemGst;
    order.total = order.subtotal + order.gstAmount;
    
    // CRITICAL: Reset order status to 'pending' because there's a new pending item
    const anyPending = order.items.some(item => item.itemStatus === 'pending');
    const anyPreparing = order.items.some(item => item.itemStatus === 'preparing');
    const allCompleted = order.items.every(item => item.itemStatus === 'completed');
    
    if (anyPending) {
      order.status = 'pending';
      console.log('🔄 New pending item added → Order status reset to PENDING');
    } else if (anyPreparing) {
      order.status = 'preparing';
    } else if (allCompleted && order.items.length > 0) {
      order.status = 'completed';
    }
    
    // Handle discount if any
    if (order.discount > 0) {
      if (order.discountType === 'percentage') {
        const discountAmount = order.total * (order.discount / 100);
        order.discountedTotal = Math.max(0, order.total - discountAmount);
      } else {
        order.discountedTotal = Math.max(0, order.total - order.discount);
      }
    } else {
      order.discountedTotal = order.total;
    }
    
    await order.save();
    
    console.log('✅ Item added successfully');
    console.log('📊 New order status:', order.status);
    
    res.status(200).json({
      success: true,
      message: 'Item added successfully',
      order: order
    });
    
  } catch (err) {
    console.error('❌ Error adding item:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add item',
      message: err.message 
    });
  }
};

// =========== REMOVE ITEM FROM ORDER ===========
exports.removeItemFromOrder = async (req, res) => {
  try {
    const { restaurantCode, billNumber, itemId } = req.params;
    
    console.log(`🗑️ Removing item ${itemId} from order ${billNumber}`);
    
    const order = await Order.findOne({ 
      restaurantCode, 
      billNumber: Number(billNumber) 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }
    
    const itemIndex = order.items.findIndex(item => 
      item._id.toString() === itemId || 
      item.itemId.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Item not found' 
      });
    }
    
    const itemToRemove = order.items[itemIndex];
    const itemTotal = itemToRemove.total || (itemToRemove.price * itemToRemove.quantity);
    const itemGst = itemTotal * (itemToRemove.gstPercentage || order.gstPercentage || 18) / 100;
    
    order.items.splice(itemIndex, 1);
    
    order.items.forEach((item, index) => {
      item.rollNumber = index + 1;
    });
    
    order.subtotal -= itemTotal;
    order.gstAmount -= itemGst;
    order.total = order.subtotal + order.gstAmount;
    
    // Recalculate order status after removal
    const allItems = order.items;
    const anyPending = allItems.some(item => item.itemStatus === 'pending');
    const anyPreparing = allItems.some(item => item.itemStatus === 'preparing');
    const allCompleted = allItems.length > 0 ? allItems.every(item => item.itemStatus === 'completed') : true;
    
    if (allItems.length === 0) {
      order.status = 'cancelled';
    } else if (anyPending) {
      order.status = 'pending';
    } else if (anyPreparing) {
      order.status = 'preparing';
    } else if (allCompleted) {
      order.status = 'completed';
    }
    
    if (order.discount > 0) {
      if (order.discountType === 'percentage') {
        const discountAmount = order.total * (order.discount / 100);
        order.discountedTotal = Math.max(0, order.total - discountAmount);
      } else {
        order.discountedTotal = Math.max(0, order.total - order.discount);
      }
    } else {
      order.discountedTotal = order.total;
    }
    
    await order.save();
    
    console.log('✅ Item removed successfully');
    console.log('📊 New order status:', order.status);
    
    res.status(200).json({
      success: true,
      message: 'Item removed successfully',
      order: order
    });
    
  } catch (err) {
    console.error('❌ Error removing item:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to remove item',
      message: err.message 
    });
  }
};

// =========== GET BILLING STATISTICS ===========
exports.getBillingStats = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📊 Getting billing stats for: ${restaurantSlug}`);
    
    const orders = await Order.find({
      restaurantSlug: restaurantSlug,
      date: today,
      status: { $ne: 'cancelled' }
    }).lean();
    
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => 
        sum + (order.discountedTotal || order.total || 0), 0),
      totalItems: orders.reduce((sum, order) => 
        sum + order.items.length, 0),
      totalDiscount: orders.reduce((sum, order) => {
        if (order.discount > 0) {
          const originalTotal = order.total || (order.subtotal + order.gstAmount);
          const discountedTotal = order.discountedTotal || originalTotal;
          return sum + (originalTotal - discountedTotal);
        }
        return sum;
      }, 0),
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        completed: orders.filter(o => o.status === 'completed').length
      }
    };
    
    res.status(200).json({
      success: true,
      statistics: stats
    });
    
  } catch (err) {
    console.error('❌ Error getting billing stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get statistics',
      message: err.message 
    });
  }
};

// =========== GET ALL ORDERS BY RESTAURANT SLUG ===========
exports.getAllOrdersByRestaurantSlug = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { date, page = 1, limit = 50000000000 } = req.query;
    
    console.log(`📊 Getting all orders for restaurant slug: ${restaurantSlug}`);
    
    // Build query
    let query = { 
      $or: [
        { restaurantSlug: restaurantSlug },
        { restaurantCode: restaurantSlug }
      ]
    };
    
    if (date) {
      query.date = date;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .sort({ date: -1, billNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Order.countDocuments(query);
    
    // Calculate statistics
    const stats = {
      totalOrders: total,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalGST: orders.reduce((sum, order) => sum + (order.gstAmount || 0), 0),
      byDate: {}
    };
    
    // Group by date for frontend display
    orders.forEach(order => {
      if (!stats.byDate[order.date]) {
        stats.byDate[order.date] = {
          count: 0,
          revenue: 0,
          orders: []
        };
      }
      stats.byDate[order.date].count++;
      stats.byDate[order.date].revenue += order.total || 0;
      stats.byDate[order.date].orders.push(order._id);
    });
    
    console.log(`✅ Found ${orders.length} orders out of ${total} total`);
    
    res.status(200).json({
      success: true,
      restaurantSlug,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: stats
    });
    
  } catch (err) {
    console.error('Error fetching all orders by slug:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: err.message 
    });
  }
};

// =========== TEST ENDPOINT ===========
exports.testEndpoint = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Order Controller is working',
      timestamp: new Date().toISOString(),
      availableMethods: Object.keys(exports).filter(key => typeof exports[key] === 'function')
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};