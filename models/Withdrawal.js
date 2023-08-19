const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: {
    type: Number,
    required: true,
  },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;
