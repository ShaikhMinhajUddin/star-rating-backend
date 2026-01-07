const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// Get overall analytics
router.get('/overall', async (req, res) => {
  try {
    const { year, month, product } = req.query;
    
    const matchStage = {};
    if (year) matchStage.year = parseInt(year);
    if (month) matchStage.month = parseInt(month);
    if (product) matchStage.productDescription = { $regex: product, $options: 'i' };

    // Get overall analytics
    const analytics = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' },
          averageRating: { $avg: '$overallRating' },
          star1: { $sum: '$star1' },
          star2: { $sum: '$star2' },
          star3: { $sum: '$star3' },
          star4: { $sum: '$star4' },
          star5: { $sum: '$star5' },
          happyCustomers: {
            $sum: { $cond: [{ $eq: ['$happyCustomer', true] }, 1, 0] }
          },
          unhappyCustomers: {
            $sum: { $cond: [{ $eq: ['$happyCustomer', false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalRatings: 1,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          starDistribution: {
            '1': '$star1',
            '2': '$star2',
            '3': '$star3',
            '4': '$star4',
            '5': '$star5'
          },
          happyCustomers: 1,
          unhappyCustomers: 1,
          satisfactionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$happyCustomers', '$totalRatings'] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ]);

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: matchStage },
      {
        $bucket: {
          groupBy: "$overallRating",
          boundaries: [0, 1, 2, 3, 4, 5],
          default: "Other",
          output: {
            count: { $sum: 1 },
            ratings: { $push: "$overallRating" }
          }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          averageRating: { $avg: '$overallRating' },
          count: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          averageRating: { $round: ['$averageRating', 2] },
          count: 1,
          totalReviews: 1
        }
      }
    ]);

    // Get quality issues summary - ALL 16 issues
    const qualityIssues = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          openCorner: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.openCorner', false] }, 1, 0] } },
          looseThread: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.looseThread', false] }, 1, 0] } },
          thinFabric: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.thinFabric', false] }, 1, 0] } },
          unravelingSeam: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.unravelingSeam', false] }, 1, 0] } },
          unclear: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.unclear', false] }, 1, 0] } },
          priceIssue: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.priceIssue', false] }, 1, 0] } },
          shadeVariation: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.shadeVariation', false] }, 1, 0] } },
          lint: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.lint', false] }, 1, 0] } },
          shortQtyInPack: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.shortQtyInPack', false] }, 1, 0] } },
          improperHem: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.improperHem', false] }, 1, 0] } },
          poorQuality: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.poorQuality', false] }, 1, 0] } },
          stain: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.stain', false] }, 1, 0] } },
          deliveryIssue: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.deliveryIssue', false] }, 1, 0] } },
          absorbency: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.absorbency', false] }, 1, 0] } },
          wet: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.wet', false] }, 1, 0] } },
          hole: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.hole', false] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: analytics[0] || {
          totalRatings: 0,
          totalReviews: 0,
          averageRating: 0,
          starDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          satisfactionRate: 0
        },
        ratingDistribution,
        monthlyTrends,
        qualityIssues: qualityIssues[0] || {
          openCorner: 0,
          looseThread: 0,
          thinFabric: 0,
          unravelingSeam: 0,
          unclear: 0,
          priceIssue: 0,
          shadeVariation: 0,
          lint: 0,
          shortQtyInPack: 0,
          improperHem: 0,
          poorQuality: 0,
          stain: 0,
          deliveryIssue: 0,
          absorbency: 0,
          wet: 0,
          hole: 0
        },
        topProducts: await getTopProducts(matchStage),
        natureOfReview: await getNatureOfReview(matchStage)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to fetch analytics data'
    });
  }
});


// Detailed analytics endpoint
router.get('/detailed', async (req, res) => {
  try {
    const { timeRange = 'monthly', startDate, endDate, product } = req.query;
    
    const matchStage = {};
    
    // Date filtering based on timeRange
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 6 months if no dates provided
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      matchStage.date = { $gte: sixMonthsAgo };
    }
    
    if (product) matchStage.productDescription = { $regex: product, $options: 'i' };

    // Get overall analytics
    const overall = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' },
          averageRating: { $avg: '$overallRating' },
          happyCustomers: { $sum: { $cond: [{ $eq: ['$happyCustomer', true] }, 1, 0] } },
          unhappyCustomers: { $sum: { $cond: [{ $eq: ['$happyCustomer', false] }, 1, 0] } },
          totalIssues: {
            $sum: {
              $add: [
                { $cond: [{ $ifNull: ['$qualityIssues.openCorner', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.looseThread', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.thinFabric', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.unravelingSeam', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.priceIssue', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.shadeVariation', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.stain', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.deliveryIssue', false] }, 1, 0] }
              ]
            }
          }
        }
      },
      {
        $project: {
          totalRatings: 1,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          satisfactionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$happyCustomers', { $add: ['$happyCustomers', '$unhappyCustomers'] }] },
                  100
                ]
              },
              2
            ]
          },
          totalIssues: 1
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          averageRating: { $round: ['$averageRating', 2] },
          totalRatings: 1,
          totalReviews: 1
        }
      }
    ]);

    // Get product performance
    const productPerformance = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$productDescription',
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' },
          happyCustomers: { $sum: { $cond: [{ $eq: ['$happyCustomer', true] }, 1, 0] } },
          issueCount: {
            $sum: {
              $add: [
                { $cond: [{ $ifNull: ['$qualityIssues.openCorner', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.looseThread', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.thinFabric', false] }, 1, 0] },
                { $cond: [{ $ifNull: ['$qualityIssues.unravelingSeam', false] }, 1, 0] }
              ]
            }
          }
        }
      },
      { $sort: { averageRating: -1 } },
      { $limit: 15 },
      {
        $project: {
          product: '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          totalRatings: 1,
          totalReviews: 1,
          satisfactionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$happyCustomers', '$totalRatings'] },
                  100
                ]
              },
              2
            ]
          },
          happyCustomers: 1,
          issueCount: 1,
          trend: { $floor: { $multiply: [{ $rand: {} }, 10] } }
        }
      }
    ]);

    // Get issue distribution
    const issueDistribution = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          openCorner: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.openCorner', false] }, 1, 0] } },
          looseThread: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.looseThread', false] }, 1, 0] } },
          thinFabric: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.thinFabric', false] }, 1, 0] } },
          unravelingSeam: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.unravelingSeam', false] }, 1, 0] } },
          priceIssue: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.priceIssue', false] }, 1, 0] } },
          shadeVariation: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.shadeVariation', false] }, 1, 0] } },
          stain: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.stain', false] }, 1, 0] } },
          deliveryIssue: { $sum: { $cond: [{ $ifNull: ['$qualityIssues.deliveryIssue', false] }, 1, 0] } }
        }
      },
      {
        $project: {
          issues: [
            { name: 'Open Corner', value: '$openCorner' },
            { name: 'Loose Thread', value: '$looseThread' },
            { name: 'Thin Fabric', value: '$thinFabric' },
            { name: 'Unraveling Seam', value: '$unravelingSeam' },
            { name: 'Price Issue', value: '$priceIssue' },
            { name: 'Shade Variation', value: '$shadeVariation' },
            { name: 'Stain', value: '$stain' },
            { name: 'Delivery Issue', value: '$deliveryIssue' }
          ]
        }
      }
    ]);

    // Get customer satisfaction distribution
    const customerSatisfaction = [
      { name: 'Happy', value: overall[0]?.satisfactionRate || 0 },
      { name: 'Unhappy', value: overall[0] ? 100 - overall[0].satisfactionRate : 0 },
      { name: 'Neutral', value: 0 }
    ];

    res.json({
      success: true,
      data: {
        overall: overall[0] || {
          totalRatings: 0,
          totalReviews: 0,
          averageRating: 0,
          satisfactionRate: 0,
          totalIssues: 0
        },
        monthlyTrends,
        productPerformance,
        issueDistribution: issueDistribution[0]?.issues || [],
        customerSatisfaction,
        ratingTrends: monthlyTrends.map(trend => ({
          period: trend.period,
          rating: trend.averageRating
        }))
      }
    });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get star distribution analytics
router.get('/star-distribution', async (req, res) => {
  try {
    const { year, month, product } = req.query;
    
    const matchStage = {};
    if (year) matchStage.year = parseInt(year);
    if (month) matchStage.month = parseInt(month);
    if (product) matchStage.productDescription = { $regex: product, $options: 'i' };

    const distribution = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: '$ttlReviews' },
          star1: { $sum: '$star1' },
          star2: { $sum: '$star2' },
          star3: { $sum: '$star3' },
          star4: { $sum: '$star4' },
          star5: { $sum: '$star5' },
          avgOverall: { $avg: '$overallRating' }
        }
      },
      {
        $project: {
          totalReviews: 1,
          starDistribution: {
            '1': '$star1',
            '2': '$star2',
            '3': '$star3',
            '4': '$star4',
            '5': '$star5'
          },
          avgOverall: { $round: ['$avgOverall', 2] }
        }
      }
    ]);

    res.json({ 
      success: true, 
      data: distribution[0] || { 
        totalReviews: 0, 
        starDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        avgOverall: 0 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product-wise analytics
router.get('/products', async (req, res) => {
  try {
    const { limit = 10, year, month } = req.query;

    const matchStage = {};
    if (year) matchStage.year = parseInt(year);
    if (month) matchStage.month = parseInt(month);

    const productAnalytics = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$productDescription',
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' },
          star1: { $sum: '$star1' },
          star2: { $sum: '$star2' },
          star3: { $sum: '$star3' },
          star4: { $sum: '$star4' },
          star5: { $sum: '$star5' },
          happyCustomers: { $sum: { $cond: [{ $eq: ['$happyCustomer', true] }, 1, 0] } }
        }
      },
      { $sort: { averageRating: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          product: '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          totalRatings: 1,
          totalReviews: 1,
          ratingDistribution: {
            '1': '$star1',
            '2': '$star2',
            '3': '$star3',
            '4': '$star4',
            '5': '$star5'
          },
          satisfactionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$happyCustomers', '$totalRatings'] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ]);

    res.json({ success: true, data: productAnalytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly analytics
router.get('/monthly', async (req, res) => {
  try {
    const { year } = req.query;

    const matchStage = {};
    if (year) matchStage.year = parseInt(year);

    const monthlyData = await Rating.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: '$ttlReviews' },
          star1: { $sum: '$star1' },
          star2: { $sum: '$star2' },
          star3: { $sum: '$star3' },
          star4: { $sum: '$star4' },
          star5: { $sum: '$star5' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          averageRating: { $round: ['$averageRating', 2] },
          totalRatings: 1,
          totalReviews: 1,
          starDistribution: {
            '1': '$star1',
            '2': '$star2',
            '3': '$star3',
            '4': '$star4',
            '5': '$star5'
          }
        }
      }
    ]);

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get top products
async function getTopProducts(matchStage) {
  return Rating.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$productDescription',
        averageRating: { $avg: '$overallRating' },
        totalRatings: { $sum: 1 },
        totalReviews: { $sum: '$ttlReviews' },
        happyCustomers: { $sum: { $cond: [{ $eq: ['$happyCustomer', true] }, 1, 0] } }
      }
    },
    { $sort: { averageRating: -1 } },
    { $limit: 10 },
    {
      $project: {
        product: '$_id',
        averageRating: { $round: ['$averageRating', 2] },
        totalRatings: 1,
        totalReviews: 1,
        satisfactionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ['$happyCustomers', '$totalRatings'] },
                100
              ]
            },
            2
          ]
        }
      }
    }
  ]);
}

// Helper function to get nature of review distribution
async function getNatureOfReview(matchStage) {
  return Rating.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$natureOfReview',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

module.exports = router;