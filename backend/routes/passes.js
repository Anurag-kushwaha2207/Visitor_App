const express = require('express');
const router = express.Router();
const { getMyPass, verifyScan, generatePassPDF } = require('../controllers/passController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/my-pass', authorize('visitor'), getMyPass);
router.post('/verify', authorize('security'), verifyScan);
router.get('/:id/pdf', generatePassPDF);

module.exports = router;
