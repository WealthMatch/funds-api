const mongoose = require('mongoose');

const mergeSchema = new mongoose.Schema({
    investmentSending: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    investmentReceiving: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    amount: { type:  Number, required: true },
    status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    sendStatus: { type: String, enum: ['pending', 'sent'], default: 'pending' },
    receiveStatus: { type: String, enum: ['pending', 'received'], default: 'pending' },
  }, { timestamps: true });

module.exports = mongoose.model('Merge', mergeSchema);
