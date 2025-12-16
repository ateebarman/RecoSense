const express = require('express');
const router = express.Router();
const { getUser, toggleLikeProduct, registerUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.get('/:user_id', getUser);
router.put('/:user_id/like', toggleLikeProduct);

module.exports = router;