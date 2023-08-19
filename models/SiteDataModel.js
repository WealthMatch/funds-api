const mongoose = require('mongoose');

const siteDataSchema = new mongoose.Schema({
  totalTransactions: {
    type: String,
    required: true,
  },
  activeUsers: {
    type: String,
    required: true,
  },
});

const SiteData = mongoose.model('SiteData', siteDataSchema);

module.exports = SiteData;
