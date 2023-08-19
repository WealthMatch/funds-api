const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
