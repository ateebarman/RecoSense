const User = require('../models/userModel');

module.exports = async function requireAdmin(req, res, next) {
  try {
    // Prefer auth middleware user, fallback to header
    const userId = (req.user && req.user.user_id) || req.header('x-user-id');
    if (!userId) return res.status(401).json({ message: 'Missing user id header' });
    const u = await User.findOne({ user_id: userId }).lean().exec();
    if (!u || !u.isAdmin) return res.status(403).json({ message: 'Admin privileges required' });
    next();
  } catch (e) {
    console.error('Admin auth error', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
