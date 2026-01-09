// const mongoose = require('mongoose');

// const ratingSchema = new mongoose.Schema({
//   // Basic Information
//   date: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   productDescription: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   item: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   comboColor: {
//     type: String,
//     required: true,
//     trim: true
//   },
  
//   // NEW: Customer Field
//   customer: {
//     type: String,
//     enum: ["Sam's Club", "Walmart", "Other"],
//     default: "Other"
//   },
  
//   // Star Ratings (Individual star counts)
//   star1: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0
//   },
//   star2: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0
//   },
//   star3: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0
//   },
//   star4: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0
//   },
//   star5: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0
//   },
  
//   // Overall Rating (Auto-calculated or manual)
//   overallRating: {
//     type: Number,
//     required: true,
//     min: 0,
//     max: 5,
//     default: 0
//   },
  
//   // Total Reviews
//   ttlReviews: {
//     type: Number,
//     required: true,
//     min: 1,
//     default: 1
//   },
  
//   // Review Details
//   reviewComments: {
//     type: String,
//     trim: true
//   },
//   natureOfReview: {
//     type: String,
//     enum: ['Positive', 'Negative', 'Neutral', 'Mixed'],
//     default: 'Neutral'
//   },
//   happyCustomer: {
//     type: Boolean,
//     default: false
//   },
//   customerExpectation: {
//     type: String,
//     enum: ['Met', 'Exceeded', 'Below'],
//     default: 'Met'
//   },
  
//   // Quality Issues (All 16 issues)
//   qualityIssues: {
//     openCorner: { type: Boolean, default: false },
//     looseThread: { type: Boolean, default: false },
//     thinFabric: { type: Boolean, default: false },
//     unravelingSeam: { type: Boolean, default: false },
//     unclear: { type: Boolean, default: false },
//     priceIssue: { type: Boolean, default: false },
//     shadeVariation: { type: Boolean, default: false },
//     lint: { type: Boolean, default: false },
//     shortQtyInPack: { type: Boolean, default: false },
//     improperHem: { type: Boolean, default: false },
//     poorQuality: { type: Boolean, default: false },
//     stain: { type: Boolean, default: false },
//     deliveryIssue: { type: Boolean, default: false },
//     absorbency: { type: Boolean, default: false },
//     wet: { type: Boolean, default: false },
//     hole: { type: Boolean, default: false }
//   },
  
//   // NEW: Form Type
//   formType: {
//     type: String,
//     enum: ['feedback', 'review'],
//     default: 'feedback'
//   },
  
//   // Timestamps
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   },
  
//   // Extracted date components for easy querying
//   year: {
//     type: Number,
//     default: () => new Date().getFullYear()
//   },
//   month: {
//     type: Number,
//     default: () => new Date().getMonth() + 1
//   },
//   day: {
//     type: Number,
//     default: () => new Date().getDate()
//   }
// }, {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Virtual for date string
// ratingSchema.virtual('dateString').get(function() {
//   return this.date ? this.date.toLocaleDateString('en-GB') : '';
// });

// // Pre-save middleware to calculate overall rating and extract date components
// ratingSchema.pre('save', function(next) {
//   // Extract date components
//   if (this.date) {
//     const d = new Date(this.date);
//     this.year = d.getFullYear();
//     this.month = d.getMonth() + 1;
//     this.day = d.getDate();
//   }
  
//   // Calculate overall rating from individual stars if not provided
//   const ratings = [this.star1, this.star2, this.star3, this.star4, this.star5];
//   const validRatings = ratings.filter(r => r > 0);
  
//   if (validRatings.length > 0 && !this.overallRating) {
//     const sum = validRatings.reduce((a, b) => a + b, 0);
//     this.overallRating = parseFloat((sum / validRatings.length).toFixed(1));
//   }
  
//   // Ensure ttlReviews is at least 1
//   if (!this.ttlReviews || this.ttlReviews < 1) {
//     this.ttlReviews = 1;
//   }
  
//   next();
// });

// // Indexes for better query performance
// ratingSchema.index({ date: -1 });
// ratingSchema.index({ year: 1, month: 1 });
// ratingSchema.index({ productDescription: 1 });
// ratingSchema.index({ item: 1 });
// ratingSchema.index({ overallRating: 1 });
// ratingSchema.index({ createdAt: -1 });
// ratingSchema.index({ formType: 1 }); // NEW: Index for form type
// ratingSchema.index({ customer: 1 }); // NEW: Index for customer

// const Rating = mongoose.model('Rating', ratingSchema);

// module.exports = Rating;