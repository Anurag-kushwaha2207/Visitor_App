const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, createUser, getAllLogs, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Apply protection to all admin routes
router.use(protect);

router.get('/stats', authorize('admin'), getDashboardStats);
router.get('/users', authorize('admin'), getUsers);
router.post('/users', authorize('admin', 'employee'), createUser);
router.put('/users/:id', authorize('admin'), updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.get('/logs', authorize('admin', 'security'), getAllLogs);

module.exports = router;
