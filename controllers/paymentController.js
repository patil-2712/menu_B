const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/PaymentModel');
const Order = require('../models/orderModel');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =========== CREATE RAZORPAY ORDER (ONLINE PAYMENT) ===========
// =========== CREATE RAZORPAY ORDER (ONLINE PAYMENT) ===========
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount, currency = 'INR' } = req.body;
    
    console.log('💰 Creating Razorpay order for:', { orderId, amount });
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Create order in Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: `order_${order.billNumber}`,
      notes: {
        orderId: order._id.toString(),  // Store the MongoDB ID as string
        billNumber: order.billNumber,
        restaurantCode: order.restaurantCode,
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        customerPhone: order.customerPhone
      },
      payment_capture: 1
    });
    
    console.log('✅ Razorpay order created:', razorpayOrder.id);
    
    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentMethod = 'upi';
    order.paymentStatus = 'pending';
    await order.save();
    
    // Create or update payment record
    let payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      payment.razorpayOrderId = razorpayOrder.id;
      payment.amount = amount;
      payment.paymentStatus = 'created';
      payment.updatedAt = new Date();
    } else {
      payment = new Payment({
        orderId: order._id,
        restaurantCode: order.restaurantCode,
        billNumber: order.billNumber,
        amount: amount,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'created',
        paymentMethod: 'upi'
      });
    }
    await payment.save();
    
    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      billNumber: order.billNumber
    });
    
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========== VERIFY ONLINE PAYMENT ===========
// =========== VERIFY PAYMENT ===========
// =========== VERIFY PAYMENT ===========
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    console.log('🔍 Verifying payment for order:', orderId);
    console.log('📝 Razorpay order ID:', razorpay_order_id);
    console.log('💳 Razorpay payment ID:', razorpay_payment_id);
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      console.log('❌ Invalid payment signature');
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
    
    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { 
        razorpayPaymentId: razorpay_payment_id, 
        razorpaySignature: razorpay_signature, 
        paymentStatus: 'paid', 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    let updatedOrder = null;
    
    if (payment) {
      // Update order using findByIdAndUpdate
      updatedOrder = await Order.findByIdAndUpdate(
        payment.orderId,
        {
          paymentStatus: 'paid',
          paymentMethod: 'upi',
          razorpayPaymentId: razorpay_payment_id,
          paymentCompletedAt: new Date()
        },
        { new: true }
      );
      
      if (updatedOrder) {
        console.log(`✅ Order ${updatedOrder.billNumber} payment completed via UPI`);
        console.log(`✅ Payment method updated to: ${updatedOrder.paymentMethod}`);
        console.log(`✅ Payment status updated to: ${updatedOrder.paymentStatus}`);
      }
    }
    
    // Return the updated order directly
    res.status(200).json({ 
      success: true, 
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      order: updatedOrder  // Return the updated order
    });
    
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========== MARK CASH PAYMENT ===========
// =========== MARK CASH PAYMENT ===========
exports.markCashPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;
    
    console.log('💵 Recording cash payment for order:', orderId);
    
    // Find and update order in one operation
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        updatedAt: new Date()
      },
      { new: true }  // Return the updated document
    );
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    console.log(`✅ Cash payment method set to: ${order.paymentMethod}`);
    console.log(`✅ Payment status: ${order.paymentStatus}`);
    
    // Update or create payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        orderId: order._id,
        restaurantCode: order.restaurantCode,
        billNumber: order.billNumber,
        amount: amount || order.total,
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        transactionId: `CASH_${order.billNumber}_${Date.now()}`,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Payment record saved:', payment._id);
    
    res.status(200).json({
      success: true,
      message: 'Cash payment method selected. Payment pending confirmation.',
      order: order
    });
    
  } catch (error) {
    console.error('❌ Error recording cash payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// =========== GET PAYMENT STATUS ===========
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId).select('paymentMethod paymentStatus razorpayPaymentId paymentCompletedAt total billNumber');
    
    if (!order) {
      return res.status(200).json({ 
        success: true, 
        paymentStatus: 'not_initiated', 
        message: 'No payment initiated for this order' 
      });
    }
    
    res.status(200).json({
      success: true,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      amount: order.total,
      billNumber: order.billNumber,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentCompletedAt: order.paymentCompletedAt
    });
    
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========== VERIFY UPI PAYMENT (Polling for Intent Flow) ===========
exports.verifyUpiPayment = async (req, res) => {
  try {
    const { razorpayPaymentId } = req.params;
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    res.json({ success: true, status: payment.status, payment: payment });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========== CREATE UPI INTENT PAYMENT (For Mobile App-like Experience) ===========
// =========== CREATE UPI INTENT PAYMENT (UPDATED - Using Standard Checkout) ===========
exports.createUpiIntentPayment = async (req, res) => {
  try {
    const { orderId, amount, customerEmail, customerPhone } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Update order with pending payment
    order.paymentMethod = 'upi';
    order.paymentStatus = 'pending';
    await order.save();
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `order_${order.billNumber}`,
      notes: { 
        orderId: orderId, 
        billNumber: order.billNumber, 
        type: 'restaurant_order',
        customerPhone: customerPhone,
        customerEmail: customerEmail
      }
    });
    
    console.log('✅ Razorpay order created:', razorpayOrder.id);
    
    // Save to database
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();
    
    let payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      payment.razorpayOrderId = razorpayOrder.id;
      payment.amount = amount;
      payment.paymentStatus = 'created';
      payment.paymentMethod = 'upi';
      payment.updatedAt = new Date();
    } else {
      payment = new Payment({
        orderId: order._id,
        restaurantCode: order.restaurantCode,
        billNumber: order.billNumber,
        amount: amount,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'created',
        paymentMethod: 'upi'
      });
    }
    await payment.save();
    
    // Return order details for standard checkout
    // The frontend will use Razorpay Checkout which handles UPI Intent automatically
    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      billNumber: order.billNumber,
      // For mobile, the checkout will handle UPI app selection
      useStandardCheckout: true
    });
    
  } catch (error) {
    console.error('UPI Intent creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =========== RAZORPAY WEBHOOK (For automatic payment updates) ===========
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    
    if (signature !== digest) {
      console.log('❌ Invalid webhook signature');
      return res.status(400).json({ status: 'invalid signature' });
    }
    
    const event = req.body;
    console.log('📨 Webhook received:', event.event);
    
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      console.log('✅ Payment captured:', payment.id);
      
      // Update payment record
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          paymentStatus: 'paid',
          paymentMethod: payment.method,
          updatedAt: new Date()
        }
      );
      
      // Update order
      const paymentRecord = await Payment.findOne({ razorpayOrderId: payment.order_id });
      if (paymentRecord) {
        await Order.findByIdAndUpdate(paymentRecord.orderId, {
          paymentStatus: 'paid',
          updatedAt: new Date()
        });
        console.log(`✅ Order ${paymentRecord.billNumber} payment status updated via webhook`);
      }
    }
    
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
// =========== VERIFY UPI PAYMENT (Polling for Intent Flow) ===========
exports.verifyUpiPayment = async (req, res) => {
  try {
    const { razorpayPaymentId } = req.params;
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    res.json({ success: true, status: payment.status, payment: payment });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// =========== CONFIRM CASH PAYMENT (FOR STAFF) ===========
exports.confirmCashPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    if (order.paymentMethod !== 'cash') {
      return res.status(400).json({ success: false, error: 'Order is not a cash payment' });
    }
    
    order.paymentStatus = 'paid';
    order.paymentCompletedAt = new Date();
    await order.save();
    
    // Update payment record
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { paymentStatus: 'paid', updatedAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cash payment confirmed',
      order: order
    });
    
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};