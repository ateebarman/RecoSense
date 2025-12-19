const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUser, toggleLikeProduct, registerUser, login, changePassword, getMe } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);
router.get('/:user_id', getUser);
router.put('/:user_id/like', toggleLikeProduct);

module.exports = router;