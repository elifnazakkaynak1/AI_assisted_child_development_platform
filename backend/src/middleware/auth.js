const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_fallback_secret_key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = decodedUser;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No permission for this action.' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };