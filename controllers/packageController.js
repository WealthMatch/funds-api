const Package = require('../models/Package');

// Create a new package
exports.createPackage = async (req, res) => {
  try {
    const { amount } = req.body;

    const newPackage = await Package.create({ amount });

    res.status(201).json({ message: 'Package created successfully', package: newPackage });
  } catch (error) {
    res.status(500).json({ message: 'Error creating package' });
  }
};

// get all packages
exports.getPackages = async (req, res) => {
  try {
    const allPackages = await Package.find().sort({ amount: 1 });

    res.status(201).json({ message: 'All packages', packages: allPackages });
    
  } catch (error) {
    res.status(500).json({ message: 'Error creating package' });
  }
};

// Delete a package by ID
exports.deletePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const package = await Package.findByIdAndDelete(packageId);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting package' });
  }
};
