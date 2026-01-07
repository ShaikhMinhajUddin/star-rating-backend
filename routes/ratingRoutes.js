const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// Create a new rating entry
router.post('/', async (req, res) => {
  try {
    const ratingData = req.body;
    
    // Validate required fields
    const requiredFields = ['year', 'month', 'date', 'productDescription', 'item', 'comboColor', 'overallRating'];
    for (const field of requiredFields) {
      if (!ratingData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const rating = new Rating(ratingData);
    await rating.save();
    
    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: rating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ratings with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      year, 
      month, 
      product, 
      minRating, 
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (year) query.year = year;
    if (month) query.month = month;
    if (product) query.productDescription = { $regex: product, $options: 'i' };
    if (minRating || maxRating) {
      query.overallRating = {};
      if (minRating) query.overallRating.$gte = parseInt(minRating);
      if (maxRating) query.overallRating.$lte = parseInt(maxRating);
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
    res.status(500).json({ error: error.message });
  }
});

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