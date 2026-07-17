const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Pack = require('../models/packModel');
const Coupon = require('../models/couponModel');
const sendTelegramNotification = require('../utils/telegram');

// Third-party shipping and payments disabled

exports.getOrder = factory.getOne(Order);
exports.getOrders = catchAsync(async (req, res, next) => {
  // Auto-delete pending card/dahabia orders older than 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  await Order.deleteMany({
    paymentMethod: { $in: ['dahabia', 'cib'] },
    status: 'pending',
    createdAt: { $lt: fifteenMinutesAgo }
  });

  return factory.getAll(Order)(req, res, next);
});
exports.deleteOrder = factory.deleteOne(Order);

// ─── GET /api/v1/orders/shipping-fee ─────────────────────────────────────────
// Public endpoint — returns express_home and express_desk fees for a given
// destination wilaya + commune pair.
exports.getShippingFee = catchAsync(async (req, res, next) => {
  const { wilaya, baladia } = req.query;

  if (!wilaya || !baladia) {
    return next(new AppError('Please provide wilaya and baladia query parameters', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      home: 0,
      stopdesk: 0,
      commune_name: baladia,
      wilaya_name: wilaya,
      retour_fee: 0,
    },
  });
});

// ─── PATCH /api/v1/orders/:id (override factory) ─────────────────────────────
// When an order is updated to 'confirmed', automatically create a Yalidine parcel.
exports.updateOrder = catchAsync(async (req, res, next) => {
  const currentOrder = await Order.findById(req.params.id);
  if (!currentOrder) {
    return next(new AppError('No order found with that ID', 404));
  }

  // Reject setting confirmed/processed CIB/Dahabia orders back to pending status
  if (
    ['cib', 'dahabia'].includes(currentOrder.paymentMethod) &&
    currentOrder.status !== 'pending' &&
    req.body.status === 'pending'
  ) {
    return next(
      new AppError(
        'Orders paid via CIB/Dahabia cannot be set back to pending status once they are processed.',
        400
      )
    );
  }

  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

// ─── POST /api/v1/orders/:id/send-to-yalidine ────────────────────────────────
exports.sendToYalidine = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  const manualTracking = `MAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  order.yalidineTracking = manualTracking;
  order.yalidineStatus = 'En préparation';
  
  order.shipping = {
    provider: 'manual',
    trackingNumber: manualTracking,
    status: 'En préparation',
    history: [
      {
        status: 'En préparation',
        location: order.wilaya,
        reason: 'Shipment created manually',
        timestamp: new Date(),
      },
    ],
  };

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Manual tracking registered: ${manualTracking}`,
    data: {
      tracking: manualTracking,
      provider: 'manual',
    },
  });
});

// ─── POST /api/v1/orders/:id/cancel-yalidine ─────────────────────────────────
exports.cancelYalidineParcel = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  order.yalidineTracking = undefined;
  order.yalidineStatus = undefined;
  order.yalidineLabelUrl = undefined;
  
  order.shipping.trackingNumber = undefined;
  order.shipping.status = undefined;
  order.shipping.labelUrl = undefined;
  order.shipping.history = [];

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Manual tracking cleared successfully',
  });
});

// ─── POST /api/v1/orders/:id/sync-shipping ─────────────────────────────────
exports.syncOrderShipping = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Shipping synced successfully (manual mode active)',
  });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    cartData,
    customerName,
    phoneNumber,
    wilaya,
    baladia,
    homeAddress,
    paymentMethod,
    shippingFee,
    shippingMethod,
    middleName,
    robotVerified,
    promoCode,
  } = req.body;

  // 1) Honeypot validation
  if (middleName !== undefined && middleName !== '') {
    return next(new AppError('Spam detected.', 400));
  }

  // 1b) Payment method validation (disabled online payments)
  if (['dahabia', 'cib', 'paypal', 'card'].includes(paymentMethod)) {
    return next(new AppError('Online payments are disabled. Please choose Cash on Delivery.', 400));
  }

  // 2) Anti-robot verification check
  if (robotVerified !== true) {
    return next(new AppError('Please confirm that you are not a robot.', 400));
  }

  // 3) Phone number pattern validation
  const phoneRegex = /^0[5-7]\d{8}$/;
  if (!phoneNumber || !phoneRegex.test(phoneNumber.trim())) {
    return next(
      new AppError(
        'Please enter a valid Algerian phone number (starting with 05, 06, or 07 followed by 8 digits).',
        400,
      ),
    );
  }

  // 4) Duplicate order check (5-minute window for same phone number)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingOrder = await Order.findOne({
    phoneNumber: phoneNumber.trim(),
    status: { $ne: 'cancelled' },
    createdAt: { $gte: fiveMinutesAgo },
  });

  if (existingOrder) {
    return next(
      new AppError(
        'You have already placed an order recently. Please wait 5 minutes before placing another.',
        429,
      ),
    );
  }

  let cart;
  try {
    cart = JSON.parse(cartData);
  } catch (err) {
    return next(new AppError('Invalid cart data', 400));
  }

  // 🚨 Detect malicious tampering
  cart.forEach((item) => {
    if (item.finalPrice || item.costPrice || item.profit) {
      return next(
        new AppError('Invalid cart data: contains forbidden fields', 400),
      );
    }
  });

  // Separate products vs packs
  const productItems = cart.filter((item) => item.type === 'product');
  const packItems = cart.filter((item) => item.type === 'pack');

  // Fetch products from DB
  const productIds = productItems.map((p) => p.id);
  const productDocs = await Product.find({ _id: { $in: productIds } });

  const orderProducts = productItems
    .map((item) => {
      const productDoc = productDocs.find(
        (p) => p._id.toString() === item.id.toString(),
      );
      if (!productDoc) return null;

      let effectivePrice = productDoc.price;
      const now = Date.now();

      // Discounts
      const autoDiscount = productDoc.discounts.find(
        (d) =>
          !d.requiresCode &&
          d.active &&
          d.discountPrice < productDoc.price &&
          (!d.discountStart || now >= new Date(d.discountStart)) &&
          (!d.discountEnd || now <= new Date(d.discountEnd)),
      );

      const codeDiscount = productDoc.discounts.find(
        (d) =>
          d.requiresCode &&
          d.active &&
          item.enteredCode &&
          d.code === item.enteredCode &&
          d.discountPrice < productDoc.price &&
          (!d.discountStart || now >= new Date(d.discountStart)) &&
          (!d.discountEnd || now <= new Date(d.discountEnd)),
      );

      if (autoDiscount && codeDiscount) {
        effectivePrice =
          autoDiscount.discountPrice <= codeDiscount.discountPrice
            ? autoDiscount.discountPrice
            : codeDiscount.discountPrice;
      } else if (autoDiscount || codeDiscount) {
        effectivePrice = (autoDiscount || codeDiscount).discountPrice;
      } else if (
        productDoc.discountPrice &&
        productDoc.discountPrice < productDoc.price
      ) {
        effectivePrice = productDoc.discountPrice;
      }

      const profit = (effectivePrice - productDoc.costPrice) * item.quantity;

      // ✅ Explicitly include name and finalPrice
      return {
        product: productDoc._id,
        name: productDoc.name || 'Unnamed Product',
        quantity: item.quantity,
        costPrice: productDoc.costPrice,
        finalPrice: effectivePrice,
        profit,
      };
    })
    .filter(Boolean);

  // Fetch packs from DB
  const packIds = packItems.map((p) => p.id);
  const packDocs = await Pack.find({ _id: { $in: packIds } });

  const orderPacks = packItems
    .map((item) => {
      const packDoc = packDocs.find(
        (p) => p._id.toString() === item.id.toString(),
      );
      if (!packDoc) return null;

      const packQuantity = item.quantity || 1;
      let effectivePackPrice = packDoc.packPrice;
      const now = Date.now();

      // Discounts
      const autoDiscount = packDoc.discounts.find(
        (d) =>
          !d.requiresCode &&
          d.active &&
          d.discountPrice < packDoc.packPrice &&
          (!d.discountStart || now >= new Date(d.discountStart)) &&
          (!d.discountEnd || now <= new Date(d.discountEnd)),
      );

      const codeDiscount = packDoc.discounts.find(
        (d) =>
          d.requiresCode &&
          d.active &&
          item.enteredCode &&
          d.code === item.enteredCode &&
          d.discountPrice < packDoc.packPrice &&
          (!d.discountStart || now >= new Date(d.discountStart)) &&
          (!d.discountEnd || now <= new Date(d.discountEnd)),
      );

      if (autoDiscount && codeDiscount) {
        effectivePackPrice =
          autoDiscount.discountPrice <= codeDiscount.discountPrice
            ? autoDiscount.discountPrice
            : codeDiscount.discountPrice;
      } else if (autoDiscount || codeDiscount) {
        effectivePackPrice = (autoDiscount || codeDiscount).discountPrice;
      } else if (
        packDoc.discountPrice &&
        packDoc.discountPrice < packDoc.packPrice
      ) {
        effectivePackPrice = packDoc.discountPrice;
      }

      const totalCost = packDoc.products.reduce(
        (sum, prod) => sum + (prod.costPrice || 0) * prod.quantity,
        0,
      );
      const profitPerPack = effectivePackPrice - totalCost;

      return {
        pack: packDoc._id,
        name: packDoc.name || 'Unnamed Pack',
        finalPrice: effectivePackPrice,
        packPrice: packDoc.packPrice,
        discountPrice: packDoc.discountPrice,
        originalPrice: packDoc.originalPrice,
        savings: packDoc.savings,
        savingsPercent: packDoc.savingsPercent,
        profit: profitPerPack * packQuantity,
        quantity: packQuantity,
        products: packDoc.products.map((prod) => ({
          productId: prod.productId,
          name: prod.name || 'Unnamed Product',
          price: prod.price,
          costPrice: prod.costPrice,
          imageCover: prod.imageCover,
          quantity: prod.quantity * packQuantity,
        })),
      };
    })
    .filter(Boolean);

  if (orderProducts.length === 0 && orderPacks.length === 0) {
    return next(new AppError('No valid products or packs found in cart', 400));
  }

  const totalAmount =
    orderProducts.reduce((sum, p) => sum + p.finalPrice * p.quantity, 0) +
    orderPacks.reduce((sum, p) => sum + p.finalPrice * p.quantity, 0);

  const totalProfit =
    orderProducts.reduce((sum, p) => sum + p.profit, 0) +
    orderPacks.reduce((sum, p) => sum + p.profit, 0);

  // Validate and apply promo code if provided
  let couponDiscount = 0;
  let couponDoc = null;

  if (promoCode) {
    const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), active: true });
    if (coupon) {
      const now = new Date();
      const isStarted = !coupon.startDate || now >= coupon.startDate;
      const isNotExpired = !coupon.endDate || now <= coupon.endDate;
      const isUnderLimit = !coupon.maxUses || coupon.usesCount < coupon.maxUses;
      const hasMinSpend = !coupon.minOrderAmount || totalAmount >= coupon.minOrderAmount;

      if (isStarted && isNotExpired && isUnderLimit && hasMinSpend) {
        couponDoc = coupon;
        if (coupon.discountType === 'percent') {
          couponDiscount = (totalAmount * coupon.value) / 100;
        } else {
          couponDiscount = coupon.value;
        }
        if (couponDiscount > totalAmount) {
          couponDiscount = totalAmount;
        }
      } else {
        return next(new AppError('The promo code is invalid, expired, or has reached its usage limit.', 400));
      }
    } else {
      return next(new AppError('Invalid promo code.', 400));
    }
  }

  const finalTotalAmount = totalAmount - couponDiscount;
  const finalTotalProfit = Math.max(0, totalProfit - couponDiscount);

  // Save order
  const order = await Order.create({
    user: req.user ? req.user._id : undefined,
    customerName,
    phoneNumber,
    wilaya,
    baladia,
    homeAddress,
    paymentMethod,
    shippingFee: Number(shippingFee) || 0,
    shippingMethod: shippingMethod || 'home',
    products: orderProducts,
    packs: orderPacks,
    totalAmount: finalTotalAmount,
    totalProfit: finalTotalProfit,
    couponCode: couponDoc ? couponDoc.code : undefined,
    couponDiscount,
  });

  // Increment coupon usage count
  if (couponDoc) {
    couponDoc.usesCount += 1;
    await couponDoc.save();
  }

  // COD triggers Telegram notification asynchronously (non-blocking)
  const plainOrder = order.toObject();
  sendTelegramNotification(plainOrder).catch(err => 
    console.error('Telegram notification failed:', err.message)
  );

  res.status(201).json({
    status: 'success',
    data: { order },
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  // Auto-delete pending card/dahabia orders older than 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  await Order.deleteMany({
    paymentMethod: { $in: ['dahabia', 'cib'] },
    status: 'pending',
    createdAt: { $lt: fifteenMinutesAgo }
  });

  let CustomerOrders;

  if (req.user) {
    // Logged-in user → match by user ID or matching phone number
    const queryConditions = [{ user: req.user._id }];
    if (req.user.phoneNumber) {
      queryConditions.push({ phoneNumber: req.user.phoneNumber });
    }
    CustomerOrders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });
  } else {
    // Guest checkout → match by phone number
    CustomerOrders = await Order.find({ phoneNumber: req.body.phoneNumber }).sort({ createdAt: -1 });
  }

  // Transform orders for customer view
  const safeOrders = CustomerOrders.map((order) => ({
    id: order._id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    wilaya: order.wilaya,
    baladia: order.baladia,
    homeAddress: order.homeAddress,

    products: order.products.map((p) => ({
      name: p.name || undefined, // optional if you snapshot name
      quantity: p.quantity,
      sellingPrice: p.sellingPrice,
      imageCover: p.imageCover || undefined,
    })),

    packs: order.packs.map((pack) => ({
      name: pack.name,
      quantity: pack.quantity,
      packPrice: pack.packPrice,
      imageCover: pack.imageCover || undefined,
    })),
  }));

  res.status(200).json({
    status: 'success',
    results: safeOrders.length,
    data: { orders: safeOrders },
  });
});

exports.checkPaymentStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { orderStatus: order.status },
  });
});

// ─── GET /api/v1/orders/track-by-phone ──────────────────────────────────────
// Public endpoint to search and track orders by phone number.
exports.trackByPhone = catchAsync(async (req, res, next) => {
  const { phone } = req.query;
  if (!phone) {
    return next(new AppError('Please provide a phone number.', 400));
  }

  const matchedOrders = await Order.find({ phoneNumber: phone })
    .populate('products.product', 'name price imageCover')
    .populate('packs.pack', 'name price imageCover')
    .sort({ createdAt: -1 });

  // Map to limited public fields for security
  const safeOrders = matchedOrders.map((order) => ({
    _id: order._id,
    id: order._id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    wilaya: order.wilaya,
    baladia: order.baladia,
    shippingMethod: order.shippingMethod,
    shippingFee: order.shippingFee,
    yalidineTracking: order.yalidineTracking,
    yalidineStatus: order.yalidineStatus,
    yalidineLabelUrl: order.yalidineLabelUrl,
    shipping: order.shipping,
    products: order.products.map((p) => ({
      product: {
        name: p.product?.name || p.name || 'Product',
        price: p.sellingPrice,
        imageCover: p.product?.imageCover || p.imageCover,
      },
      quantity: p.quantity,
    })),
    packs: order.packs.map((pack) => ({
      pack: {
        name: pack.pack?.name || pack.name || 'Pack',
        price: pack.packPrice,
        imageCover: pack.pack?.imageCover || pack.imageCover,
      },
      quantity: pack.quantity,
    })),
  }));

  res.status(200).json({
    status: 'success',
    results: safeOrders.length,
    data: { orders: safeOrders },
  });
});

exports.checkPaymentStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { orderStatus: order.status },
  });
});

// ─── GET /api/v1/orders/track-by-phone ──────────────────────────────────────
// Public endpoint to search and track orders by phone number.
exports.trackByPhone = catchAsync(async (req, res, next) => {
  const { phone } = req.query;
  if (!phone) {
    return next(new AppError('Please provide a phone number.', 400));
  }

  const matchedOrders = await Order.find({ phoneNumber: phone })
    .populate('products.product', 'name price imageCover')
    .populate('packs.pack', 'name price imageCover')
    .sort({ createdAt: -1 });

  // Map to limited public fields for security
  const safeOrders = matchedOrders.map((order) => ({
    _id: order._id,
    id: order._id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    wilaya: order.wilaya,
    baladia: order.baladia,
    shippingMethod: order.shippingMethod,
    shippingFee: order.shippingFee,
    yalidineTracking: order.yalidineTracking,
    yalidineStatus: order.yalidineStatus,
    yalidineLabelUrl: order.yalidineLabelUrl,
    shipping: order.shipping,
    products: order.products.map((p) => ({
      product: {
        name: p.product?.name || p.name || 'Product',
        price: p.sellingPrice,
        imageCover: p.product?.imageCover || p.imageCover,
      },
      quantity: p.quantity,
    })),
    packs: order.packs.map((pack) => ({
      pack: {
        name: pack.pack?.name || pack.name || 'Pack',
        price: pack.packPrice,
        imageCover: pack.pack?.imageCover || pack.imageCover,
      },
      quantity: pack.quantity,
    })),
  }));

  res.status(200).json({
    status: 'success',
    results: safeOrders.length,
    data: { orders: safeOrders },
  });
});

exports.trackOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  // Remove sensitive profit field
  const publicOrder = order.toObject();
  delete publicOrder.totalProfit;

  res.status(200).json({
    status: 'success',
    data: {
      order: publicOrder,
    },
  });
});

