const SiteData = require('../models/SiteDataModel');

// Create site data
exports.createSiteData = async (req, res) => {
  try {
    const { totalTransactions, activeUsers } = req.body;

    const newSiteData = await SiteData.create({ totalTransactions, activeUsers });

    res.status(201).json({ message: 'Site data created successfully', siteData: newSiteData });
  } catch (error) {
    res.status(500).json({ message: 'Error creating site data' });
  }
};

// Read site data
exports.getSiteData = async (req, res) => {
  try {
    const siteData = await SiteData.find();
    res.status(200).json({ siteData });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching site data' });
  }
};

// Delete site data
exports.deleteSiteData = async (req, res) => {
  try {
    const { siteDataId } = req.params;

    const siteData = await SiteData.findByIdAndDelete(siteDataId);

    if (!siteData) {
      return res.status(404).json({ message: 'Site data not found' });
    }

    res.status(200).json({ message: 'Site data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting site data' });
  }
};
