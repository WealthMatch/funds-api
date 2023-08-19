const express = require('express');
const siteDataController = require('../controllers/siteDataController');

const router = express.Router();

// Create site data
router.post('/create', siteDataController.createSiteData);

// Read site data
router.get('/get', siteDataController.getSiteData);

// Delete site data by ID
router.delete('/delete/:siteDataId', siteDataController.deleteSiteData);

module.exports = router;
