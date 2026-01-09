const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Create Rating Schema
const ratingSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  date: { type: Number, required: true },
  productDescription: { type: String, required: true },
  item: { type: String, required: true },
  comboColor: { type: String, required: true },
  customer: { type: String, required: true },
  star1: { type: String, default: '0' },
  star2: { type: String, default: '0' },
  star3: { type: String, default: '0' },
  star4: { type: String, default: '0' },
  star5: { type: String, default: '0' },
  overallRating: { type: String, default: '0' },
  ttlReviews: { type: String, required: true },
  reviewComments: { type: String, default: '' },
  natureOfReview: { type: String, default: 'Neutral' },
  happyCustomer: { type: String, default: '' },
  customerExpectation: { type: String, default: '' },
  openCorner: { type: String, default: '' },
  looseThread: { type: String, default: '' },
  thinFabric: { type: String, default: '' },
  unravelingSeam: { type: String, default: '' },
  unclear: { type: String, default: '' },
  priceIssue: { type: String, default: '' },
  shadeVariation: { type: String, default: '' },
  lint: { type: String, default: '' },
  shortQty: { type: String, default: '' },
  improperHem: { type: String, default: '' },
  poorQuality: { type: String, default: '' },
  stain: { type: String, default: '' },
  deliveryIssue: { type: String, default: '' },
  absorbency: { type: String, default: '' },
  wet: { type: String, default: '' },
  hole: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Rating = mongoose.model('Rating', ratingSchema);

// ================ API ROUTES ================

// ========= 1. FEEDBACK FORM ENDPOINT (Feedback Tab) =========
app.post('/api/ratings', async (req, res) => {
  try {
    console.log('📥 Received feedback submission:', req.body);
    
    const formData = req.body;
    const today = new Date();
    
    // ✅ DIRECT FIELDS USE KAREIN - NESTED OBJECT NAHI
    const feedbackData = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      date: today.getDate(),
      productDescription: formData.productDescription || 'Unknown Product',
      item: formData.item || 'Unknown Item',
      comboColor: formData.comboColor || 'Unknown',
      customer: formData.customer || 'Other',
      star1: (formData.star1 || 0).toString(),
      star2: (formData.star2 || 0).toString(),
      star3: (formData.star3 || 0).toString(),
      star4: (formData.star4 || 0).toString(),
      star5: (formData.star5 || 0).toString(),
      overallRating: (formData.overallRating || 0).toString(),
      ttlReviews: (formData.ttlReviews || 1).toString(),
      reviewComments: formData.reviewComments || '',
      natureOfReview: formData.natureOfReview || 'Neutral',
      happyCustomer: formData.happyCustomer || '',
      customerExpectation: formData.customerExpectation || '',
      
      // ✅ Quality Issues - Direct strings
      openCorner: String(formData.openCorner || ''),
      looseThread: String(formData.looseThread || ''),
      thinFabric: String(formData.thinFabric || ''),
      unravelingSeam: String(formData.unravelingSeam || ''),
      unclear: String(formData.unclear || ''),
      priceIssue: String(formData.priceIssue || ''),
      shadeVariation: String(formData.shadeVariation || ''),
      lint: String(formData.lint || ''),
      shortQty: String(formData.shortQty || ''),
      improperHem: String(formData.improperHem || ''),
      poorQuality: String(formData.poorQuality || ''),
      stain: String(formData.stain || ''),
      deliveryIssue: String(formData.deliveryIssue || ''),
      absorbency: String(formData.absorbency || ''),
      wet: String(formData.wet || ''),
      hole: String(formData.hole || ''),
      
      createdAt: today
    };

    console.log('📝 Prepared feedback data:', feedbackData);

    const rating = new Rating(feedbackData);
    await rating.save();
    
    console.log('✅ Feedback saved successfully. ID:', rating._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully!', 
      data: rating 
    });
  } catch (error) {
    console.error('❌ Error saving feedback:', error.message);
    res.status(400).json({ 
      success: false, 
      message: 'Error saving feedback', 
      error: error.message 
    });
  }
});

// ========= 2. REVIEWS FORM ENDPOINT (Reviews Tab) - FIXED =========
app.post('/api/ratings/reviews', async (req, res) => {
  try {
    console.log('📥 Received review submission (raw):', req.body);
    console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));
    
    // Extract data - NO NESTING, just use req.body directly
    const formData = req.body;
    const today = new Date();
    
    // Prepare review data
    const reviewData = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      date: today.getDate(),
      productDescription: formData.productDescription || 'Unknown Product',
      item: formData.item || 'Unknown Item',
      comboColor: formData.comboColor || 'Unknown',
      customer: formData.customer || 'Other',
      star1: (formData.star1 || 0).toString(),
      star2: (formData.star2 || 0).toString(),
      star3: (formData.star3 || 0).toString(),
      star4: (formData.star4 || 0).toString(),
      star5: (formData.star5 || 0).toString(),
      overallRating: (formData.overallRating || 0).toString(),
      ttlReviews: (formData.ttlReviews || 1).toString(),
      reviewComments: '',
      natureOfReview: 'Neutral',
      happyCustomer: '',
      customerExpectation: '',
      openCorner: '',
      looseThread: '',
      thinFabric: '',
      unravelingSeam: '',
      unclear: '',
      priceIssue: '',
      shadeVariation: '',
      lint: '',
      shortQty: '',
      improperHem: '',
      poorQuality: '',
      stain: '',
      deliveryIssue: '',
      absorbency: '',
      wet: '',
      hole: '',
      createdAt: today
    };

    console.log('📝 Prepared review data:', reviewData);

    // Validate required fields
    const requiredFields = [
      'productDescription', 
      'item', 
      'comboColor', 
      'customer', 
      'overallRating', 
      'ttlReviews'
    ];
    
    const missingFields = [];
    for (const field of requiredFields) {
      if (!reviewData[field] || reviewData[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ Missing required fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    const rating = new Rating(reviewData);
    await rating.save();
    
    console.log('✅ Review saved successfully. ID:', rating._id);
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: rating
    });
  } catch (error) {
    console.error('❌ Error saving review:', error.message);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving review', 
      error: error.message
    });
  }
});

// ========= 3. DEBUG ENDPOINT =========
app.post('/api/debug', async (req, res) => {
  console.log('🔍 DEBUG - Request body:', req.body);
  console.log('🔍 DEBUG - Headers:', req.headers);
  res.json({
    success: true,
    received: req.body,
    timestamp: new Date().toISOString(),
    message: 'Debug endpoint working'
  });
});

// ========= 4. GET ALL RATINGS =========
app.get('/api/ratings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      year, 
      month, 
      product, 
      minRating, 
      maxRating 
    } = req.query;
    
    const query = {};
    
    if (year) query.year = year;
    if (month) query.month = month;
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = minRating;
      if (maxRating) query.overallRating.$lte = maxRating;
    }
    
    const ratings = await Rating.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Rating.countDocuments(query);
    
    res.json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching ratings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching ratings', 
      error: error.message 
    });
  }
});

// ========= 5. GET SINGLE RATING BY ID =========
app.get('/api/ratings/:id', async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    res.json({ success: true, data: rating });
  } catch (error) {
    console.error('❌ Error fetching rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching rating', 
      error: error.message 
    });
  }
});

// ========= 6. UPDATE RATING =========
app.put('/api/ratings/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Rating updated successfully', 
      data: rating 
    });
  } catch (error) {
    console.error('❌ Error updating rating:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating rating', 
      error: error.message 
    });
  }
});

// ========= 7. DELETE RATING =========
app.delete('/api/ratings/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Rating deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting rating', 
      error: error.message 
    });
  }
});

// ========= 8. GET DASHBOARD ANALYTICS =========
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const query = {};
    
    if (req.query.year) query.year = parseInt(req.query.year);
    if (req.query.month) query.month = parseInt(req.query.month);
    if (req.query.customer) query.customer = req.query.customer;
    
    const ratings = await Rating.find(query);
    
    // Basic calculations
    const totalRatings = ratings.length;
    let totalReviews = 0;
    let totalRating = 0;
    
    ratings.forEach(rating => {
      const star1 = parseInt(rating.star1) || 0;
      const star2 = parseInt(rating.star2) || 0;
      const star3 = parseInt(rating.star3) || 0;
      const star4 = parseInt(rating.star4) || 0;
      const star5 = parseInt(rating.star5) || 0;
      
      const sum = star1 + star2 + star3 + star4 + star5;
      totalReviews += sum;
      
      if (sum > 0) {
        const weighted = (star1 * 1) + (star2 * 2) + (star3 * 3) + (star4 * 4) + (star5 * 5);
        totalRating += weighted / sum;
      }
    });
    
    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;
    
    // Star distribution
    const star1Total = ratings.reduce((sum, r) => sum + (parseInt(r.star1) || 0), 0);
    const star2Total = ratings.reduce((sum, r) => sum + (parseInt(r.star2) || 0), 0);
    const star3Total = ratings.reduce((sum, r) => sum + (parseInt(r.star3) || 0), 0);
    const star4Total = ratings.reduce((sum, r) => sum + (parseInt(r.star4) || 0), 0);
    const star5Total = ratings.reduce((sum, r) => sum + (parseInt(r.star5) || 0), 0);
    
    // Customer distribution
    const customerCounts = {};
    ratings.forEach(r => {
      const customer = r.customer || 'Unknown';
      customerCounts[customer] = (customerCounts[customer] || 0) + 1;
    });
    
    const customerDistribution = Object.entries(customerCounts).map(([name, value]) => ({
      name,
      value,
      color: name === "Sam's Club" ? '#87A96B' : name === "Walmart" ? '#D4AF37' : '#800020'
    }));
    
    // Send response
    res.json({
      overall: {
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
        happyCustomerRate: 0,
        qualityIssues: 0
      },
      star1Total,
      star2Total,
      star3Total,
      star4Total,
      star5Total,
      customerDistribution,
      monthlyTrends: [],
      qualityIssues: [],
      topProducts: []
    });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
});

// ========= 9. GET FILTER OPTIONS =========
app.get('/api/ratings/filters', async (req, res) => {
  try {
    const customers = await Rating.distinct('customer');
    const products = await Rating.distinct('productDescription');
    
    res.json({
      customers: customers.filter(c => c).sort(),
      products: products.filter(p => p).sort()
    });
  } catch (error) {
    console.error('❌ Filters error:', error);
    res.json({
      customers: ["Sam's Club", "Walmart"],
      products: []
    });
  }
});

// ========= HEALTH CHECK =========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/ratings - Feedback form',
      'POST /api/ratings/reviews - Reviews form',
      'GET /api/ratings - Get all ratings',
      'GET /api/analytics/dashboard - Dashboard data',
      'GET /api/health - Health check'
    ]
  });
});

// ========= 404 HANDLER =========
app.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// ========= ERROR HANDLER =========
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// ========= START SERVER =========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB Atlas Connected: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log(`✅ Endpoints available:`);
  console.log(`   POST /api/ratings`);
  console.log(`   POST /api/ratings/reviews`);
  console.log(`   GET  /api/health`);
});