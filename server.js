const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// ========= SCHEMAS =========

// Rating Schema - UPDATED with new fields and separate combo & color
const ratingSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  date: { type: Number, required: true },
  productDescription: { type: String, required: true },
  item: { type: String, required: true },
  combo: { type: String, default: '' },      // ALAG FIELD
  color: { type: String, default: '' },      // ALAG FIELD
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
  
  // ✅ ALL FIELDS FROM FRONTEND INCLUDING NEW ONES
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
  
  // ✅ NEW FIELDS ADDED FROM FRONTEND FORMS
  harshFeel: { type: String, default: '' },
  skrinkage: { type: String, default: '' },
  pilling: { type: String, default: '' },
  colorBleeding: { type: String, default: '' },
  outOfStock: { type: String, default: '' },
  badSmall: { type: String, default: '' },
  shapeOut: { type: String, default: '' },
  
  createdAt: { type: Date, default: Date.now }
});

const Rating = mongoose.model('Rating', ratingSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'sams', 'walmart'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ========= SEED INITIAL USERS =========
const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      const users = [
        {
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin'
        },
        {
          username: 'sams',
          password: await bcrypt.hash('sams123', 10),
          role: 'sams'
        },
        {
          username: 'walmart',
          password: await bcrypt.hash('walmart123', 10),
          role: 'walmart'
        }
      ];

      await User.insertMany(users);
      console.log('✅ 3 fixed users created successfully');
      console.log('📋 Login Credentials:');
      console.log('   Admin: admin / admin123');
      console.log('   Sam\'s Club: sams / sams123');
      console.log('   Walmart: walmart / walmart123');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

// Call seed function after DB connection
mongoose.connection.once('open', () => {
  seedUsers();
});

// ========= AUTHENTICATION MIDDLEWARE =========
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required. Please login first.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ratings-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token. Please login again.' 
    });
  }
};

// ========= AUTH ROUTES =========

// 1. LOGIN ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Login attempt for:', username);

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'ratings-secret-key-2024',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', username, 'Role:', user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// 2. VALIDATE TOKEN ENDPOINT
app.get('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 3. LOGOUT ENDPOINT
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ========= PROTECTED ROUTES =========

// ========= 1. FEEDBACK FORM ENDPOINT (Feedback Tab) =========
app.post('/api/ratings', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Received feedback submission from:', req.user.username);
    
    const formData = req.body;
    const userRole = req.user.role;
    
    // Role-based validation
    if (userRole === 'sams' && formData.customer !== "Sam's Club") {
      return res.status(403).json({ 
        success: false, 
        message: 'Sam\'s Club users can only submit data for Sam\'s Club' 
      });
    }
    
    if (userRole === 'walmart' && formData.customer !== "Walmart") {
      return res.status(403).json({ 
        success: false, 
        message: 'Walmart users can only submit data for Walmart' 
      });
    }
    
    const today = new Date();
    
    const feedbackData = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      date: today.getDate(),
      productDescription: formData.productDescription || 'Unknown Product',
      item: formData.item || 'Unknown Item',
      combo: formData.combo || '',      // Alag field
      color: formData.color || '',      // Alag field
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
      
      // ✅ ALL FIELDS INCLUDING NEW ONES
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
      
      // ✅ NEW FIELDS
      harshFeel: String(formData.harshFeel || ''),
      skrinkage: String(formData.skrinkage || ''),
      pilling: String(formData.pilling || ''),
      colorBleeding: String(formData.colorBleeding || ''),
      outOfStock: String(formData.outOfStock || ''),
      badSmall: String(formData.badSmall || ''),
      shapeOut: String(formData.shapeOut || ''),
      
      createdAt: today
    };

    console.log('📝 Prepared feedback data for:', formData.customer);

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

// ========= 2. REVIEWS FORM ENDPOINT (Reviews Tab) =========
app.post('/api/ratings/reviews', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Received review submission from:', req.user.username);
    
    const formData = req.body;
    const userRole = req.user.role;
    
    // Role-based validation
    if (userRole === 'sams' && formData.customer !== "Sam's Club") {
      return res.status(403).json({ 
        success: false, 
        message: 'Sam\'s Club users can only submit data for Sam\'s Club' 
      });
    }
    
    if (userRole === 'walmart' && formData.customer !== "Walmart") {
      return res.status(403).json({ 
        success: false, 
        message: 'Walmart users can only submit data for Walmart' 
      });
    }
    
    const today = new Date();
    
    const reviewData = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      date: today.getDate(),
      productDescription: formData.productDescription || 'Unknown Product',
      item: formData.item || 'Unknown Item',
      combo: formData.combo || '',      // Alag field
      color: formData.color || '',      // Alag field
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
      harshFeel: '',
      skrinkage: '',
      pilling: '',
      colorBleeding: '',
      outOfStock: '',
      badSmall: '',
      shapeOut: '',
      createdAt: today
    };

    console.log('📝 Prepared review data for:', formData.customer);

    // Validate required fields
    const requiredFields = [
      'productDescription', 
      'item', 
      'combo', 
      'color', 
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
    res.status(500).json({ 
      success: false, 
      message: 'Error saving review', 
      error: error.message
    });
  }
});

// ========= 3. GET ALL RATINGS (with role-based filtering) =========
app.get('/api/ratings', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const { 
      page = 1, 
      limit = 20, 
      year, 
      month, 
      product, 
      minRating, 
      maxRating 
    } = req.query;
    
    // Build query with role-based filter
    const query = {};
    
    // Role-based customer filter
    if (userRole === 'sams') {
      query.customer = "Sam's Club";
    } else if (userRole === 'walmart') {
      query.customer = "Walmart";
    }
    
    // Apply other filters
    if (year) query.year = year;
    if (month) query.month = month;
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = minRating;
      if (maxRating) query.overallRating.$lte = maxRating;
    }
    
    console.log(`📋 Ratings request - User: ${req.user.username}, Role: ${userRole}, Query:`, query);
    
    const ratings = await Rating.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Rating.countDocuments(query);
    
    res.json({
      success: true,
      data: ratings,
      userRole: userRole,
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

// ========= 4. GET SINGLE RATING BY ID (with role check) =========
app.get('/api/ratings/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    
    // Role-based access check
    if (userRole === 'sams' && rating.customer !== "Sam's Club") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view Sam\'s Club data.' 
      });
    }
    
    if (userRole === 'walmart' && rating.customer !== "Walmart") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view Walmart data.' 
      });
    }
    
    res.json({ 
      success: true, 
      data: rating,
      userRole: userRole 
    });
  } catch (error) {
    console.error('❌ Error fetching rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching rating', 
      error: error.message 
    });
  }
});

// ========= 5. UPDATE RATING (with role check) =========
app.put('/api/ratings/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // First check if rating exists and user has access
    const existingRating = await Rating.findById(req.params.id);
    if (!existingRating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    
    // Role-based access check
    if (userRole === 'sams' && existingRating.customer !== "Sam's Club") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update Sam\'s Club data.' 
      });
    }
    
    if (userRole === 'walmart' && existingRating.customer !== "Walmart") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update Walmart data.' 
      });
    }
    
    const rating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
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

// ========= 6. DELETE RATING (with role check) =========
app.delete('/api/ratings/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // First check if rating exists and user has access
    const existingRating = await Rating.findById(req.params.id);
    if (!existingRating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }
    
    // Role-based access check
    if (userRole === 'sams' && existingRating.customer !== "Sam's Club") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete Sam\'s Club data.' 
      });
    }
    
    if (userRole === 'walmart' && existingRating.customer !== "Walmart") {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete Walmart data.' 
      });
    }
    
    const rating = await Rating.findByIdAndDelete(req.params.id);
    
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

// ========= 7. GET DASHBOARD ANALYTICS (with role-based filtering) =========
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const { dashboardType = 'feedback', ...filters } = req.query;
    
    // Build query with role-based filter
    let query = {};
    
    // Apply role-based customer filter
    if (userRole === 'sams') {
      query.customer = "Sam's Club";
    } else if (userRole === 'walmart') {
      query.customer = "Walmart";
    }
    // Admin - no customer filter (sab dikhega)
    
    // Apply other filters
    if (filters.year) query.year = parseInt(filters.year);
    if (filters.month) query.month = parseInt(filters.month);
    if (filters.product) query.productDescription = { $regex: filters.product, $options: 'i' };
    if (filters.customer && userRole === 'admin') {
      query.customer = filters.customer; // Admin can filter by any customer
    }
    if (filters.minRating) {
      query.overallRating = { $gte: parseFloat(filters.minRating) };
    }

    console.log(`📊 Dashboard request - User: ${req.user.username}, Role: ${userRole}, Query:`, query);

    const ratings = await Rating.find(query);
    
    // Basic calculations
    const totalRatings = ratings.length;
    let totalReviews = 0;
    let totalRating = 0;
    let happyCustomers = 0;
    let metExpectations = 0;
    
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
      
      // For feedback analytics
      if (rating.happyCustomer === 'true' || rating.happyCustomer === true) {
        happyCustomers++;
      }
      
      if (rating.customerExpectation === 'Met') {
        metExpectations++;
      }
    });
    
    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;
    const happyCustomerRate = totalRatings > 0 ? (happyCustomers / totalRatings) * 100 : 0;
    const expectationMetRate = totalRatings > 0 ? (metExpectations / totalRatings) * 100 : 0;

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

    // Quality Issues Analysis (for feedback dashboard) - INCLUDING NEW FIELDS
    const qualityIssues = [];
    if (dashboardType === 'feedback') {
      const issuesMap = {};
      ratings.forEach(r => {
        const qualityFields = [
          'openCorner', 'looseThread', 'thinFabric', 'unravelingSeam', 'unclear',
          'priceIssue', 'shadeVariation', 'lint', 'shortQty', 'improperHem',
          'poorQuality', 'stain', 'deliveryIssue', 'absorbency', 'wet', 'hole',
          // ✅ NEW FIELDS ADDED
          'harshFeel', 'skrinkage', 'pilling', 'colorBleeding', 'outOfStock',
          'badSmall', 'shapeOut'
        ];
        
        qualityFields.forEach(field => {
          if (r[field] && r[field].toString().trim() !== '') {
            const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            issuesMap[fieldName] = (issuesMap[fieldName] || 0) + 1;
          }
        });
      });
      
      qualityIssues.push(...Object.entries(issuesMap).map(([name, value]) => ({
        name,
        value,
        color: value > 10 ? '#800020' : value > 5 ? '#D4AF37' : '#87A96B'
      })));
    }

    // Nature of Review Data (for feedback dashboard)
    const natureOfReviewData = [];
    if (dashboardType === 'feedback') {
      const natureCounts = {};
      ratings.forEach(r => {
        const nature = r.natureOfReview || 'Neutral';
        natureCounts[nature] = (natureCounts[nature] || 0) + 1;
      });
      
      natureOfReviewData.push(...Object.entries(natureCounts).map(([name, value], index) => ({
        name,
        value,
        color: index % 3 === 0 ? '#800020' : index % 3 === 1 ? '#D4AF37' : '#87A96B'
      })));
    }

    // Happy Customer Data (for feedback dashboard)
    const happyCustomerData = [];
    if (dashboardType === 'feedback') {
      const monthGroups = {};
      ratings.forEach(r => {
        const month = r.month;
        if (!monthGroups[month]) monthGroups[month] = { happy: 0, total: 0 };
        monthGroups[month].total++;
        if (r.happyCustomer === 'true' || r.happyCustomer === true) {
          monthGroups[month].happy++;
        }
      });
      
      Object.entries(monthGroups).forEach(([month, data]) => {
        happyCustomerData.push({
          period: `Month ${month}`,
          satisfaction: data.total > 0 ? (data.happy / data.total * 100) : 0
        });
      });
    }

    // Expectation Data (for feedback dashboard)
    const expectationData = [];
    if (dashboardType === 'feedback') {
      const expectationCounts = {};
      ratings.forEach(r => {
        const expectation = r.customerExpectation || 'Unknown';
        expectationCounts[expectation] = (expectationCounts[expectation] || 0) + 1;
      });
      
      const total = ratings.length;
      Object.entries(expectationCounts).forEach(([name, count]) => {
        expectationData.push({
          name,
          value: total > 0 ? (count / total * 100) : 0
        });
      });
    }

    // Monthly Trends (for reviews dashboard)
    const monthlyTrends = [];
    if (dashboardType === 'reviews') {
      const monthData = {};
      ratings.forEach(r => {
        const month = r.month;
        if (!monthData[month]) monthData[month] = { totalRating: 0, count: 0, reviews: 0 };
        
        const star1 = parseInt(r.star1) || 0;
        const star2 = parseInt(r.star2) || 0;
        const star3 = parseInt(r.star3) || 0;
        const star4 = parseInt(r.star4) || 0;
        const star5 = parseInt(r.star5) || 0;
        
        const sum = star1 + star2 + star3 + star4 + star5;
        monthData[month].reviews += sum;
        
        if (sum > 0) {
          const weighted = (star1 * 1) + (star2 * 2) + (star3 * 3) + (star4 * 4) + (star5 * 5);
          monthData[month].totalRating += weighted / sum;
          monthData[month].count++;
        }
      });
      
      Object.entries(monthData).forEach(([month, data]) => {
        monthlyTrends.push({
          month: `M-${month}`,
          averageRating: data.count > 0 ? parseFloat((data.totalRating / data.count).toFixed(2)) : 0,
          reviews: data.reviews
        });
      });
    }

    // Top Products
    const topProducts = [];
    const productData = {};
    ratings.forEach(r => {
      const product = r.productDescription || 'Unknown';
      if (!productData[product]) {
        productData[product] = {
          product,
          totalReviews: 0,
          totalRating: 0,
          count: 0,
          qualityIssues: 0,
          customer: r.customer || 'Unknown'
        };
      }
      
      const star1 = parseInt(r.star1) || 0;
      const star2 = parseInt(r.star2) || 0;
      const star3 = parseInt(r.star3) || 0;
      const star4 = parseInt(r.star4) || 0;
      const star5 = parseInt(r.star5) || 0;
      
      const sum = star1 + star2 + star3 + star4 + star5;
      productData[product].totalReviews += sum;
      
      if (sum > 0) {
        const weighted = (star1 * 1) + (star2 * 2) + (star3 * 3) + (star4 * 4) + (star5 * 5);
        productData[product].totalRating += weighted / sum;
        productData[product].count++;
      }
      
      // Count quality issues INCLUDING NEW FIELDS
      if (dashboardType === 'feedback') {
        const qualityFields = [
          'openCorner', 'looseThread', 'thinFabric', 'unravelingSeam', 'unclear',
          'priceIssue', 'shadeVariation', 'lint', 'shortQty', 'improperHem',
          'poorQuality', 'stain', 'deliveryIssue', 'absorbency', 'wet', 'hole',
          // ✅ NEW FIELDS ADDED
          'harshFeel', 'skrinkage', 'pilling', 'colorBleeding', 'outOfStock',
          'badSmall', 'shapeOut'
        ];
        
        qualityFields.forEach(field => {
          if (r[field] && r[field].toString().trim() !== '') {
            productData[product].qualityIssues++;
          }
        });
      }
    });

    // Convert to array and calculate averages
    topProducts.push(...Object.values(productData).map(p => ({
      ...p,
      averageRating: p.count > 0 ? parseFloat((p.totalRating / p.count).toFixed(2)) : 0
    })).sort((a, b) => {
      if (dashboardType === 'feedback') {
        return a.qualityIssues - b.qualityIssues;
      } else {
        return b.averageRating - a.averageRating;
      }
    }).slice(0, 10));

    // Send response
    const response = {
      success: true,
      userRole: userRole,
      overall: {
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
        happyCustomerRate: parseFloat(happyCustomerRate.toFixed(2)),
        expectationMetRate: parseFloat(expectationMetRate.toFixed(2)),
        qualityIssues: qualityIssues.reduce((sum, issue) => sum + issue.value, 0)
      },
      star1Total,
      star2Total,
      star3Total,
      star4Total,
      star5Total,
      customerDistribution,
      monthlyTrends,
      qualityIssues,
      topProducts,
      natureOfReviewData,
      happyCustomerData,
      expectationData
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
});

// ========= 8. GET FILTER OPTIONS (with role-based filtering) =========
app.get('/api/ratings/filters', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let customerQuery = {};
    
    // Apply role-based filter
    if (userRole === 'sams') {
      customerQuery.customer = "Sam's Club";
    } else if (userRole === 'walmart') {
      customerQuery.customer = "Walmart";
    }
    
    const customers = await Rating.distinct('customer', customerQuery);
    const products = await Rating.distinct('productDescription', customerQuery);
    const combos = await Rating.distinct('combo', customerQuery);
    const colors = await Rating.distinct('color', customerQuery);
    
    res.json({
      success: true,
      customers: customers.filter(c => c).sort(),
      products: products.filter(p => p).sort(),
      combos: combos.filter(c => c).sort(),
      colors: colors.filter(c => c).sort(),
      userRole: userRole
    });
  } catch (error) {
    console.error('❌ Filters error:', error);
    res.json({
      success: true,
      customers: userRole === 'admin' ? ["Sam's Club", "Walmart"] : 
                userRole === 'sams' ? ["Sam's Club"] : ["Walmart"],
      products: [],
      combos: [],
      colors: [],
      userRole: userRole
    });
  }
});

// ========= 9. DEBUG ENDPOINT (protected) =========
app.post('/api/debug', authenticateToken, async (req, res) => {
  console.log('🔍 DEBUG - User:', req.user.username, 'Role:', req.user.role);
  console.log('🔍 DEBUG - Request body:', req.body);
  res.json({
    success: true,
    user: req.user,
    received: req.body,
    timestamp: new Date().toISOString(),
    message: 'Debug endpoint working'
  });
});

// ========= 10. HEALTH CHECK (public) =========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/login - Login',
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
  console.log(`✅ Authentication System Active`);
  console.log(`📋 Fixed Users Created:`);
  console.log(`   Admin: admin / admin123`);
  console.log(`   Sam's Club: sams / sams123`);
  console.log(`   Walmart: walmart / walmart123`);
  console.log(`✅ New fields added: harshFeel, skrinkage, pilling, colorBleeding, outOfStock, badSmall, shapeOut`);
  console.log(`✅ Combo & Color now separate fields`);
});