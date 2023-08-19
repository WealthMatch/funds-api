const jwt = require('jsonwebtoken');

const secretKey = 'your-secret-key'; // Replace with your actual secret key

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Authorization token not found' });
  }

  // Extract the token value after 'Bearer '
  const tokenValue = token.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(tokenValue, secretKey);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
