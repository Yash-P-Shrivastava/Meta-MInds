const jwt = require('jsonwebtoken');

// Secret key for JWT (in production, you should store it in an environment variable)
const JWT_SECRET =  process.env.JWT_SECRET_KEY;
console.log(JWT_SECRET);


const verifyToken = (req, res, next) => {
  const token = req.cookies.token;  // Access token from the cookies
  // console.log(token);
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Store decoded user info (e.g., userId) in req for later use
    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
