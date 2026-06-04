const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, updateAppointmentStatus, getHosts } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.put('/:id/status', authorize('admin', 'employee'), updateAppointmentStatus);
router.get('/hosts', getHosts);

module.exports = router;
