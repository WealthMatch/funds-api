const express = require('express');
const packageController = require('../controllers/packageController');

const router = express.Router();

// Create a new package
router.post('/create', packageController.createPackage);

router.get('/all', packageController.getPackages);

// Delete a package by ID
router.delete('/delete/:packageId', packageController.deletePackage);

module.exports = router;
