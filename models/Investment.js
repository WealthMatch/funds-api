const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sendTo: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Merge' }
  ],
  amountInvested: { type: Number, required: true },
  amountExpected: { type: Number, required: true },
  status: { type: String, enum: ['pending-merge', 'paid', 'merged', 'admin-paid', 'pending-payment', 'awaiting-payment'], default: 'pending-merge' },
  dateInvested: { type: Date },
  dateToReceive: { type: Date },
  mergedToSendAmount: {
    type: Number,
    default: 0
  },
  mergedToSendComplete: Boolean,
  mergedToReceiveAmount:  {
    type: Number,
    default: 0
  },
  mergedToReceiveComplete: Boolean,
  amountSent: {
    type: Number,
    default: 0
  },
  amountReceived: {
    type: Number,
    default: 0
  },
  receiveFrom: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Merge' }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);
