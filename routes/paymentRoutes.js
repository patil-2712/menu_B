const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// =========== RAZORPAY PAYMENT ROUTES ===========

// Create Razorpay order for payment
router.post('/create-order', paymentController.createRazorpayOrder);

// Verify payment after successful transaction
router.post('/verify-payment', paymentController.verifyPayment);

// Get payment status for an order
router.get('/status/:orderId', paymentController.getPaymentStatus);

// Mark order as cash payment (offline)
router.post('/cash/:orderId', paymentController.markCashPayment);

// =========== ADD THIS MISSING ROUTE ===========
// Create UPI Intent payment (for mobile app-like experience)
router.post('/create-upi-intent', paymentController.createUpiIntentPayment);

// Verify UPI payment status (for polling)
router.get('/verify/:razorpayPaymentId', paymentController.verifyUpiPayment);
// Confirm Counter UPI Payment (for staff)
router.post('/upi-counter-confirm/:orderId', paymentController.confirmUpiCounterPayment);
// Webhook for Razorpay (for automatic payment updates)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.razorpayWebhook);
// Add this route
router.post('/cash-confirm/:orderId', paymentController.confirmCashPayment);
// Add this line with other routes
router.post('/upi-counter/:orderId', paymentController.markUpiCounterPayment);


// Add this line with other routes
router.post('/upi_counter-confirm/:orderId', paymentController.confirmUpiCounterPayment);


module.exports = router;