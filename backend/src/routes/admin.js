const express = require('express');
const { getStats, listUsers } = require('../controllers/adminController');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authRequired, adminRequired, getStats);
router.get('/usuarios', authRequired, adminRequired, listUsers);

module.exports = router;
