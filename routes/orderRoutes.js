//
//const express = require('express');
//const router = express.Router();
//const orderController = require('../controllers/orderController');
//const customerRequestController = require('../controllers/customerRequestController');
//
//// =========== EXISTING ROUTES (DO NOT MODIFY) ===========
//router.get('/test', orderController.testEndpoint);
//router.get('/verify/:restaurantSlug', orderController.verifyRestaurantAccess);
//router.get('/restaurant/:restaurantSlug/analytics', orderController.getRestaurantOrdersAnalytics);
//router.get('/restaurant/:restaurantSlug/all-orders', orderController.getAllOrdersByRestaurantSlug);
//router.post('/', orderController.createOrder);
//router.get('/kitchen/:restaurantSlug', orderController.getKitchenOrders);
//router.get('/billing/:restaurantSlug', orderController.getBillingOrders);
//router.get('/billing/:restaurantSlug/stats', orderController.getBillingStats);
//router.get('/:restaurantCode/latest-bill', orderController.getLatestBillNumber);
//router.get('/:restaurantCode/orders', orderController.getOrdersByRestaurantCode);
//router.get('/:restaurantCode/today', orderController.getTodaysOrders);
//router.get('/:restaurantCode/search', orderController.searchOrders);
//router.get('/:restaurantCode/stats', orderController.getOrderStatistics);
//router.get('/:restaurantCode/:billNumber', orderController.getOrderByRestaurantAndBill);
//router.put('/:restaurantCode/:billNumber', orderController.updateOrder);
//router.patch('/:restaurantCode/:billNumber/status', orderController.updateOrderStatus);
//router.patch('/:restaurantCode/:billNumber/item-status', orderController.updateItemStatus);
//router.post('/:restaurantCode/:billNumber/discount', orderController.applyOrderDiscount);
//router.post('/:restaurantCode/:billNumber/items', orderController.addItemToOrder);
//router.delete('/:restaurantCode/:billNumber/items/:itemId', orderController.removeItemFromOrder);
//router.delete('/:restaurantCode/:billNumber', orderController.deleteOrder);
//router.get('/verify-restaurant/:restaurantSlug', orderController.verifyRestaurantAccess);
//router.get('/', async (req, res) => {
//  try {
//    const Order = require('../models/orderModel');
//    const orders = await Order.find().sort({ createdAt: -1 });
//    res.json(orders);
//  } catch (error) {
//    res.status(500).json({ message: 'Server Error' });
//  }
//});
//
//// Add this with your other routes (around line 15)
//router.get('/id/:orderId', orderController.getOrderById);
//
//// =========== NEW CUSTOMER REQUEST ROUTES (ADD THESE AT THE END) ===========
//// Using different base path to avoid conflicts with existing routes
//router.post('/customer-request/create', customerRequestController.createRequest);
//router.get('/customer-request/list/:restaurantSlug', customerRequestController.getRequestsByRestaurant);
//router.get('/customer-request/order/:orderId', customerRequestController.getRequestsByOrder);
//router.put('/customer-request/update/:requestId', customerRequestController.updateRequestStatus);
//router.delete('/customer-request/delete/:requestId', customerRequestController.deleteRequest);
//router.post('/customer-request/bulk-update', customerRequestController.bulkUpdateRequests);
//
//module.exports = router;

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const customerRequestController = require('../controllers/customerRequestController');

// =========== EXISTING ROUTES ===========
router.get('/test', orderController.testEndpoint);
router.get('/verify/:restaurantSlug', orderController.verifyRestaurantAccess);
router.get('/restaurant/:restaurantSlug/analytics', orderController.getRestaurantOrdersAnalytics);
router.get('/restaurant/:restaurantSlug/all-orders', orderController.getAllOrdersByRestaurantSlug);
router.post('/', orderController.createOrder);
router.get('/kitchen/:restaurantSlug', orderController.getKitchenOrders);
router.get('/billing/:restaurantSlug', orderController.getBillingOrders);
router.get('/billing/:restaurantSlug/stats', orderController.getBillingStats);

// =========== IMPORTANT: ID ROUTE MUST COME BEFORE ANY PARAM ROUTES ===========
// This MUST be before /:restaurantCode routes to avoid conflicts
router.get('/id/:orderId', orderController.getOrderById);

// =========== RESTAURANT CODE BASED ROUTES ===========
router.get('/:restaurantCode/latest-bill', orderController.getLatestBillNumber);
router.get('/:restaurantCode/orders', orderController.getOrdersByRestaurantCode);
router.get('/:restaurantCode/today', orderController.getTodaysOrders);
router.get('/:restaurantCode/search', orderController.searchOrders);
router.get('/:restaurantCode/stats', orderController.getOrderStatistics);

// =========== ORDER BY RESTAURANT CODE AND BILL NUMBER ===========
router.get('/:restaurantCode/:billNumber', orderController.getOrderByRestaurantAndBill);
router.put('/:restaurantCode/:billNumber', orderController.updateOrder);
router.patch('/:restaurantCode/:billNumber/status', orderController.updateOrderStatus);
router.patch('/:restaurantCode/:billNumber/item-status', orderController.updateItemStatus);
router.post('/:restaurantCode/:billNumber/discount', orderController.applyOrderDiscount);
router.post('/:restaurantCode/:billNumber/items', orderController.addItemToOrder);
router.delete('/:restaurantCode/:billNumber/items/:itemId', orderController.removeItemFromOrder);
router.delete('/:restaurantCode/:billNumber', orderController.deleteOrder);

router.get('/verify-restaurant/:restaurantSlug', orderController.verifyRestaurantAccess);

router.get('/', async (req, res) => {
  try {
    const Order = require('../models/orderModel');
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// =========== CUSTOMER REQUEST ROUTES ===========
router.post('/customer-request/create', customerRequestController.createRequest);
router.get('/customer-request/list/:restaurantSlug', customerRequestController.getRequestsByRestaurant);
router.get('/customer-request/order/:orderId', customerRequestController.getRequestsByOrder);
router.put('/customer-request/update/:requestId', customerRequestController.updateRequestStatus);
router.delete('/customer-request/delete/:requestId', customerRequestController.deleteRequest);
router.post('/customer-request/bulk-update', customerRequestController.bulkUpdateRequests);

module.exports = router;