const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  whatsappNumber: String,
  paymentNumber: String,
  paymentType: String,
  password: String,
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  totalReferrals: {
    type: Number,
    default: 0,
  },
  cmp: {
    type: Boolean,
    default: false,
  },
  referralsAmount: {
    type: Number,
    default: 0,
  },
  referredBy: {
    type: String,
    default: null
  },
});

module.exports = mongoose.model('User', userSchema);
