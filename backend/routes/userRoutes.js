const express = require('express');
const router = express.Router();
const { getUser, toggleLikeProduct } = require('../controllers/userController');

router.get('/:user_id', getUser);
router.put('/:user_id/like', toggleLikeProduct);

module.exports = router;