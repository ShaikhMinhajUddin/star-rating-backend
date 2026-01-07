const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// ================ IMPORTANT: Define specific routes BEFORE generic routes ================

// Create a new review entry (Reviews Form) - MUST come before /:id
router.post('/reviews', async (req, res) => {
  try {
    const reviewData = req.body;
    
    // Validate required fields for REVIEWS FORM
    const requiredFields = ['productDescription', 'item', 'comboColor', 'overallRating', 'ttlReviews'];
    for (const field of requiredFields) {
      if (!reviewData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Set form type and auto-fill empty fields
    reviewData.formType = 'review';
    reviewData.date = new Date();
    
    // Set empty values for fields not in reviews form
    if (!reviewData.customer) reviewData.customer = 'Other';
    if (!reviewData.reviewComments) reviewData.reviewComments = '';
    if (!reviewData.natureOfReview) reviewData.natureOfReview = 'Neutral';
    if (reviewData.happyCustomer === undefined) reviewData.happyCustomer = false;
    if (!reviewData.customerExpectation) reviewData.customerExpectation = 'Met';
    
    // Set all quality issues to false if not provided
    if (!reviewData.qualityIssues) {
      reviewData.qualityIssues = {
        openCorner: false,
        looseThread: false,
        thinFabric: false,
        unravelingSeam: false,
        unclear: false,
        priceIssue: false,
        shadeVariation: false,
        lint: false,
        shortQtyInPack: false,
        improperHem: false,
        poorQuality: false,
        stain: false,
        deliveryIssue: false,
        absorbency: false,
        wet: false,
        hole: false
      };
    }
    
    const review = new Rating(reviewData);
    await review.save();
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: review
    });
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving review', 
      error: error.message 
    });
  }
});

// Get statistics by form type - MUST come before /:id
router.get('/stats/by-form-type', async (req, res) => {
  try {
    const stats = await Rating.aggregate([
      {
        $group: {
          _id: '$formType',
          count: { $sum: 1 },
          avgRating: { $avg: '$overallRating' },
          totalReviews: { $sum: '$ttlReviews' }
        }
      },
      {
        $project: {
          formType: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 2] },
          totalReviews: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================ MAIN ROUTES ================

// Create a new rating entry (UNIFIED ENDPOINT for both forms)
router.post('/', async (req, res) => {
  try {
    const ratingData = req.body;
    
    // Validate required fields for BOTH FORMS
    const requiredFields = ['productDescription', 'item', 'comboColor', 'customer', 'overallRating', 'ttlReviews'];
    for (const field of requiredFields) {
      if (!ratingData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Check if formType is provided in request
    // If not provided, determine based on data
    if (!ratingData.formType) {
      // Auto-detect form type based on data
      const hasQualityIssues = ratingData.qualityIssues && 
        Object.values(ratingData.qualityIssues).some(value => 
          value === true || value === 'true' || value === 'True'
        );
      
      const hasReviewDetails = ratingData.reviewComments || 
                              ratingData.happyCustomer || 
                              ratingData.customerExpectation ||
                              (ratingData.natureOfReview && ratingData.natureOfReview !== 'Neutral');
      
      ratingData.formType = (hasQualityIssues || hasReviewDetails) ? 'feedback' : 'review';
    }
    
    console.log('Saving rating with formType:', ratingData.formType);
    
    const rating = new Rating(ratingData);
    await rating.save();
    
    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully!',
      data: rating
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving rating', 
      error: error.message 
    });
  }
});

// Get all ratings with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      year, 
      month, 
      product, 
      minRating, 
      maxRating,
      customer,
      formType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    if (customer) query.customer = customer;
    if (formType) query.formType = formType;
    
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = parseFloat(minRating);
      if (maxRating) query.overallRating.$lte = parseFloat(maxRating);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ratings = await Rating.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Rating.countDocuments(query);

    res.json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================ SINGLE RATING ROUTES (must come LAST) ================

// Get rating by ID
router.get('/:id', async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    res.json({ success: true, data: rating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rating
router.put('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: rating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rating
router.delete('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;