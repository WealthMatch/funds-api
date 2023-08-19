const express = require('express');
const authController = require('../controllers/authControllers');
const authMiddleware = require('../midlewares/authMidleware');

const router = express.Router();

// router.post('/signup', authController.signup);

// router.post('/signin', authController.signin);

// router.post('/admin/signup', authController.adminSignup);

// router.post('/admin/signin', authController.adminSignin);

// router.get('/admin/profile', authMiddleware, authController.getAdminProfile);

// router.put('/profile-update', authMiddleware, authController.updateUserProfile);

// router.put('/password-update', authMiddleware, authController.updateUserPassword);

// router.get('/user-earnings', authMiddleware, authController.getUserEarnings);

// router.get('/profile', authMiddleware, authController.getUserProfile);

// router.post('/user-withdraw', authMiddleware, authController.submitWithdrawalRequest);

// router.post('/add-payment-info', authMiddleware, authController.addPaymentInfo);

// router.get('/get-all-users', authController.getAllUsers);

// router.put('/suspend-user/:userId', authController.suspendUser);

module.exports = router;

