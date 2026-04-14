const express = require('express');
const router = express.Router();
const customerRequestController = require('../controllers/customerRequestController');
const orderController = require('../controllers/orderController');

// Test endpoint
router.get('/test', orderController.testEndpoint);

// Restaurant verification and analytics
router.get('/verify/:restaurantSlug', orderController.verifyRestaurantAccess);
router.get('/restaurant/:restaurantSlug/analytics', orderController.getRestaurantOrdersAnalytics);
router.get('/restaurant/:restaurantSlug/all-orders', orderController.getAllOrdersByRestaurantSlug);

// Create order
router.post('/', orderController.createOrder);

// Get kitchen orders for restaurant (kitchen display)
router.get('/kitchen/:restaurantSlug', orderController.getKitchenOrders);

// Get billing orders for restaurant (billing staff)
router.get('/billing/:restaurantSlug', orderController.getBillingOrders);
router.get('/billing/:restaurantSlug/stats', orderController.getBillingStats);

// Get latest bill number for a restaurant
router.get('/:restaurantCode/latest-bill', orderController.getLatestBillNumber);

// Get all orders for a restaurant
router.get('/:restaurantCode/orders', orderController.getOrdersByRestaurantCode);

// Get today's orders for a restaurant
router.get('/:restaurantCode/today', orderController.getTodaysOrders);

// Search orders
router.get('/:restaurantCode/search', orderController.searchOrders);

// Get order statistics
router.get('/:restaurantCode/stats', orderController.getOrderStatistics);

// Get specific order by restaurant and bill number
router.get('/:restaurantCode/:billNumber', orderController.getOrderByRestaurantAndBill);

// Update order
router.put('/:restaurantCode/:billNumber', orderController.updateOrder);

// Update order status
router.patch('/:restaurantCode/:billNumber/status', orderController.updateOrderStatus);

// Update item status
router.patch('/:restaurantCode/:billNumber/item-status', orderController.updateItemStatus);

// Apply discount to order (for billing staff)
router.post('/:restaurantCode/:billNumber/discount', orderController.applyOrderDiscount);

// Add item to order (for billing staff)
router.post('/:restaurantCode/:billNumber/items', orderController.addItemToOrder);

// Remove item from order (for billing staff)
router.delete('/:restaurantCode/:billNumber/items/:itemId', orderController.removeItemFromOrder);

// Delete order
router.delete('/:restaurantCode/:billNumber', orderController.deleteOrder);
router.get('/verify-restaurant/:restaurantSlug', orderController.verifyRestaurantAccess);



router.post('/customer-request', customerRequestController.createRequest);
router.get('/customer-requests/:restaurantSlug', customerRequestController.getRequestsByRestaurant);
router.get('/customer-requests/order/:orderId', customerRequestController.getRequestsByOrder);
router.put('/customer-request/:requestId', customerRequestController.updateRequestStatus);
router.delete('/customer-request/:requestId', customerRequestController.deleteRequest);
router.post('/customer-requests/bulk', customerRequestController.bulkUpdateRequests);


///errg
//fg
// For backward compatibility - get all orders (admin only)
router.get('/', async (req, res) => {
  try {
    const Order = require('../models/orderModel');
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;