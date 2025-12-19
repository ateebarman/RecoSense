const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const jwtSecret = process.env.JWT_SECRET || 'secret';

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.header('authorization') || req.header('Authorization');
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token) return res.status(401).json({ message: 'Missing auth token' });
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ user_id: payload.user_id }).lean().exec();
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    delete user.password;
    req.user = user;
    // Backwards compatibility: set x-user-id header for code that checks it
    req.headers['x-user-id'] = user.user_id;
    next();
  } catch (e) {
    console.error('Auth error', e);
    return res.status(401).json({ message: 'Invalid token' });
  }
};