const CustomerRequest = require('../models/customerRequestModel');
const Order = require('../models/orderModel');

// Create customer request (FIXED - allows null orderId and billNumber)
exports.createRequest = async (req, res) => {
  try {
    const { 
      orderId, 
      billNumber, 
      restaurantSlug, 
      restaurantCode,
      customerName,
      tableNumber,
      requestType,
      requestMessage
    } = req.body;

    console.log('📝 Creating customer request:', { orderId, billNumber, requestType, customerName, tableNumber });

    // FIXED: Only validate required fields, orderId and billNumber are optional
    if (!restaurantSlug || !requestType || !customerName || !tableNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: restaurantSlug, requestType, customerName, tableNumber are required'
      });
    }

    // If orderId is provided, verify order exists (optional)
    let orderExists = false;
    let orderCustomerName = customerName;
    let orderTableNumber = tableNumber;
    let orderBillNumber = billNumber;
    let orderRestaurantCode = restaurantCode;

    if (orderId && orderId !== 'null' && orderId !== null) {
      try {
        const order = await Order.findById(orderId);
        if (order) {
          orderExists = true;
          orderCustomerName = order.customerName || customerName;
          orderTableNumber = order.tableNumber || tableNumber;
          orderBillNumber = order.billNumber || billNumber;
          orderRestaurantCode = order.restaurantCode || restaurantCode;
        }
      } catch (err) {
        console.log('Order not found, continuing without order reference');
      }
    }

    // Create new request (orderId and billNumber can be null/undefined)
    const newRequest = new CustomerRequest({
      orderId: orderId && orderId !== 'null' ? orderId : null,
      billNumber: orderBillNumber,
      restaurantSlug,
      restaurantCode: orderRestaurantCode || restaurantCode || restaurantSlug.toUpperCase(),
      customerName: orderCustomerName || customerName,
      tableNumber: orderTableNumber || tableNumber,
      requestType,
      requestMessage: requestMessage || getRequestMessage(requestType),
      status: 'pending'
    });

    await newRequest.save();

    console.log('✅ Customer request created:', newRequest._id);

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      request: newRequest
    });

  } catch (err) {
    console.error('❌ Error creating customer request:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create request',
      message: err.message
    });
  }
};

const getRequestMessage = (type) => {
  switch(type) {
    case 'water': return 'Customer requested bottle of water';
    case 'tissue': return 'Customer requested tissue paper';
    case 'bill': return 'Customer requested the bill';
    default: return 'Customer made a request';
  }
};

// Get requests by restaurant (FIXED - handles null orderId)
exports.getRequestsByRestaurant = async (req, res) => {
  try {
    const { restaurantSlug } = req.params;
    const { status, limit = 50, page = 1 } = req.query;

    let query = { restaurantSlug };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await CustomerRequest.find(query)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await CustomerRequest.countDocuments(query);

    const stats = {
      total: await CustomerRequest.countDocuments({ restaurantSlug }),
      pending: await CustomerRequest.countDocuments({ restaurantSlug, status: 'pending' }),
      acknowledged: await CustomerRequest.countDocuments({ restaurantSlug, status: 'acknowledged' }),
      completed: await CustomerRequest.countDocuments({ restaurantSlug, status: 'completed' }),
      byType: {
        water: await CustomerRequest.countDocuments({ restaurantSlug, requestType: 'water' }),
        tissue: await CustomerRequest.countDocuments({ restaurantSlug, requestType: 'tissue' }),
        bill: await CustomerRequest.countDocuments({ restaurantSlug, requestType: 'bill' })
      }
    };

    res.status(200).json({
      success: true,
      requests,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('❌ Error fetching requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
      message: err.message
    });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, staffResponse } = req.body;

    if (!['pending', 'acknowledged', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const updateData = { status };
    if (status === 'acknowledged') updateData.acknowledgedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();
    if (staffResponse) updateData.staffResponse = staffResponse;

    const updatedRequest = await CustomerRequest.findByIdAndUpdate(
      requestId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Request status updated',
      request: updatedRequest
    });

  } catch (err) {
    console.error('❌ Error updating request:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update request',
      message: err.message
    });
  }
};

// Get requests by order
exports.getRequestsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const requests = await CustomerRequest.find({ orderId }).sort({ requestedAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error('❌ Error fetching order requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
      message: err.message
    });
  }
};

// Delete request
exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const deletedRequest = await CustomerRequest.findByIdAndDelete(requestId);
    if (!deletedRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    res.status(200).json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting request:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete request',
      message: err.message
    });
  }
};

// Bulk update requests
exports.bulkUpdateRequests = async (req, res) => {
  try {
    const { requestIds, status } = req.body;
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Request IDs array is required' });
    }

    const updateData = { status };
    if (status === 'acknowledged') updateData.acknowledgedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();

    const result = await CustomerRequest.updateMany(
      { _id: { $in: requestIds } },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} requests updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('❌ Error bulk updating requests:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update requests',
      message: err.message
    });
  }
};