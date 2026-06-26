const express = require('express');
const adminController = require('../controllers/adminController');
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

router.get('/dashboard', protect, adminOnly, adminController.getDashboardStats);

module.exports = router;
