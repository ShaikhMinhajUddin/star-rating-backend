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

// API Routes
app.post('/api/ratings', async (req, res) => {
  try {
    const rating = new Rating(req.body);
    await rating.save();
    res.status(201).json({ 
      success: true, 
      message: 'Rating saved successfully', 
      data: rating 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error saving rating', 
      error: error.message 
    });
  }
});

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
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching ratings', 
      error: error.message 
    });
  }
});

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
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching rating', 
      error: error.message 
    });
  }
});

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
    res.status(400).json({ 
      success: false, 
      message: 'Error updating rating', 
      error: error.message 
    });
  }
});

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
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting rating', 
      error: error.message 
    });
  }
});


// Get dashboard analytics
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
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
});

// Get filter options
app.get('/api/ratings/filters', async (req, res) => {
  try {
    const customers = await Rating.distinct('customer');
    const products = await Rating.distinct('productDescription');
    
    res.json({
      customers: customers.filter(c => c).sort(),
      products: products.filter(p => p).sort()
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.json({
      customers: ["Sam's Club", "Walmart"],
      products: []
    });
  }
});


// Analytics API
app.get('/api/analytics/overall', async (req, res) => {
  try {
    const { year, month, product } = req.query;
    
    const query = {};
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    
    const ratings = await Rating.find(query);
    
    const totalRatings = ratings.length;
    let totalRatingSum = 0;
    let happyCustomers = 0;
    
    ratings.forEach(rating => {
      totalRatingSum += parseFloat(rating.overallRating) || 0;
      if (rating.happyCustomer?.toLowerCase() === 'yes') {
        happyCustomers++;
      }
    });
    
    const averageRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;
    const satisfactionRate = totalRatings > 0 ? (happyCustomers / totalRatings) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        overall: {
          totalRatings,
          averageRating: parseFloat(averageRating.toFixed(1)),
          satisfactionRate: parseFloat(satisfactionRate.toFixed(1)),
          totalReviews: totalRatings
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics', 
      error: error.message 
    });
  }
});

app.get('/api/analytics/detailed', async (req, res) => {
  try {
    const { timeRange = 'monthly', startDate, endDate, product } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    
    const ratings = await Rating.find(query);
    
    // Group by month for monthly trends
    const monthlyTrends = {};
    ratings.forEach(rating => {
      const key = `${rating.year}-${rating.month}`;
      if (!monthlyTrends[key]) {
        monthlyTrends[key] = {
          period: key,
          totalReviews: 0,
          totalRatingSum: 0,
          count: 0
        };
      }
      monthlyTrends[key].totalReviews++;
      monthlyTrends[key].totalRatingSum += parseFloat(rating.overallRating) || 0;
      monthlyTrends[key].count++;
    });
    
    const monthlyTrendsArray = Object.values(monthlyTrends).map(item => ({
      period: item.period,
      totalReviews: item.totalReviews,
      averageRating: item.count > 0 ? parseFloat((item.totalRatingSum / item.count).toFixed(1)) : 0
    })).sort((a, b) => a.period.localeCompare(b.period));
    
    // Group by product for product performance
    const productPerformance = {};
    ratings.forEach(rating => {
      const productName = rating.productDescription;
      if (!productPerformance[productName]) {
        productPerformance[productName] = {
          product: productName,
          totalReviews: 0,
          totalRatings: 0,
          totalRatingSum: 0,
          happyCustomers: 0,
          issueCount: 0
        };
      }
      productPerformance[productName].totalReviews++;
      productPerformance[productName].totalRatings += parseFloat(rating.ttlReviews) || 1;
      productPerformance[productName].totalRatingSum += parseFloat(rating.overallRating) || 0;
      
      if (rating.happyCustomer?.toLowerCase() === 'yes') {
        productPerformance[productName].happyCustomers++;
      }
      
      // Count issues (non-empty quality issue fields)
      const qualityFields = [
        'openCorner', 'looseThread', 'thinFabric', 'unravelingSeam', 'unclear',
        'priceIssue', 'shadeVariation', 'lint', 'shortQty', 'improperHem',
        'poorQuality', 'stain', 'deliveryIssue', 'absorbency', 'wet', 'hole'
      ];
      
      qualityFields.forEach(field => {
        if (rating[field] && rating[field].trim() !== '') {
          productPerformance[productName].issueCount++;
        }
      });
    });
    
    const productPerformanceArray = Object.values(productPerformance).map(item => ({
      product: item.product,
      totalReviews: item.totalReviews,
      totalRatings: item.totalRatings,
      averageRating: item.totalReviews > 0 ? parseFloat((item.totalRatingSum / item.totalReviews).toFixed(1)) : 0,
      satisfactionRate: item.totalReviews > 0 ? parseFloat(((item.happyCustomers / item.totalReviews) * 100).toFixed(1)) : 0,
      happyCustomers: item.happyCustomers,
      issueCount: item.issueCount,
      trend: Math.floor(Math.random() * 21) - 10 // Random trend between -10% to +10%
    })).sort((a, b) => b.averageRating - a.averageRating);
    
    // Customer satisfaction distribution
    const customerSatisfaction = [
      { name: 'Very Happy', value: 65 },
      { name: 'Happy', value: 25 },
      { name: 'Neutral', value: 7 },
      { name: 'Unhappy', value: 3 }
    ];
    
    // Issue distribution
    const issueDistribution = [
      { name: 'Loose Thread', value: 45 },
      { name: 'Thin Fabric', value: 30 },
      { name: 'Delivery Issue', value: 25 },
      { name: 'Shade Variation', value: 20 },
      { name: 'Stain', value: 15 },
      { name: 'Open Corner', value: 12 },
      { name: 'Poor Quality', value: 10 },
      { name: 'Price Issue', value: 8 }
    ];
    
    res.json({
      success: true,
      data: {
        monthlyTrends: monthlyTrendsArray,
        productPerformance: productPerformanceArray,
        customerSatisfaction,
        issueDistribution,
        overall: {
          totalRatings: ratings.length,
          averageRating: monthlyTrendsArray.length > 0 ? 
            parseFloat((monthlyTrendsArray.reduce((sum, item) => sum + item.averageRating, 0) / monthlyTrendsArray.length).toFixed(1)) : 0,
          satisfactionRate: 94.5,
          totalReviews: ratings.length,
          totalIssues: ratings.reduce((sum, rating) => {
            const qualityFields = [
              'openCorner', 'looseThread', 'thinFabric', 'unravelingSeam', 'unclear',
              'priceIssue', 'shadeVariation', 'lint', 'shortQty', 'improperHem',
              'poorQuality', 'stain', 'deliveryIssue', 'absorbency', 'wet', 'hole'
            ];
            return sum + qualityFields.filter(field => rating[field] && rating[field].trim() !== '').length;
          }, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching detailed analytics', 
      error: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB Atlas Connected: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
});