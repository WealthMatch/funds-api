const express = require('express');
const investmentController = require('../controllers/investmentController');
const authMiddleware = require('../midlewares/authMidleware');

const router = express.Router();

//USER
router.post('/create', authMiddleware, investmentController.createInvestment);
router.get('/user-pending-send-merges-payments', authMiddleware, investmentController.getUserPendingSendMergePayments);
router.get('/user-pending-receive-merges-payments', authMiddleware, investmentController.getUserPendingReceiveMergePayments);
router.get('/user-done-merges', authMiddleware, investmentController.getDoneMergePayments);
router.get('/pending-investments', authMiddleware, investmentController.getAllUserPendingInvestment);
router.get('/user-paid-investments', authMiddleware, investmentController.getAllUserDoneInvestment);
router.get('/user-sends', authMiddleware, investmentController.getUserSendToInvestMents);
router.get('/user-receives', authMiddleware, investmentController.getUserReceiveFromInvestMents);
router.put('/update-receive-status/:mergeId', authMiddleware, investmentController.updateReceiveStatus);
router.put('/update-send-status/:mergeId', investmentController.updateSendStatus);
router.delete('/delete/:investmentId', authMiddleware, investmentController.deleteInvestment);

//ADMIN
router.get('/admin-accounts', investmentController.getAllAdminAccounts);
router.post('/create-admin-accounts', investmentController.createAdminProfile);
router.get('/admin-investments-pending-payment', investmentController.getAdminInvestMentsPendingPayment);
router.get('/admin-investments-awaiting-payment', investmentController.getAdminInvestMentsAwaitingPayment);
router.get('/pending-merge', investmentController.getAllPendingMerge);
router.get('/pending-payment-investments', investmentController.getInvestmentsByPendingPayment);
router.get('/awaiting-payment-investments', investmentController.getInvestmentsWithStatusAwaitingPayment);

router.get('/paid-investments', investmentController.getCompletedInvestments);
router.get('/investments-pending-merge-today', investmentController.getPendingMergeToday);
router.get('/get-all-investments', investmentController.getAllInvestments);
router.post('/create-merge', investmentController.mergeInvestments);
router.put('/cancel-merge/:mergeId', investmentController.cancelMerge);
router.post('/create-admin-investment', investmentController.createAdminInvestment);


// NEW
router.post('/create-admin-send-investment', investmentController.mergeAdminToPayUser);
router.get('/admin-send-investments', investmentController.getAdminPendingSendPayInvestments);
router.get('/admin-receive-investments', investmentController.getAdminPendingReceivePayInvestments);

module.exports = router;