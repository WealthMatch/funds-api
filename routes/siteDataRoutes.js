const express = require('express');
const siteDataController = require('../controllers/siteDataController');
const authMiddleware = require('../midlewares/authMidleware');

const router = express.Router();

// Create site data
router.post('/create', authMiddleware, siteDataController.createSiteData);

// Read site data
router.get('/get', siteDataController.getSiteData);

// Delete site data by ID
router.delete('/delete/:siteDataId', siteDataController.deleteSiteData);

module.exports = router;
