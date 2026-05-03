const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.error('CRITICAL: JWT_SECRET is missing or too short (min 32 chars).');
        res.status(500);
        throw new Error('Server Configuration Error: JWT_SECRET is not properly configured.');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true },
        });

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Session expired, please login again');
      }
      console.error('AUTH ERROR:', error.message);
      res.status(401);
      throw new Error('Not authorized, token validation failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no session token found');
  }
});

module.exports = { protect };