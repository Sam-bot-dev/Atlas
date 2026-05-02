const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Strict Environment Check
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('CRITICAL: JWT_SECRET is missing or too short (min 32 chars).');
    res.status(500);
    throw new Error('Server Configuration Error: JWT_SECRET is not properly configured.');
  }

  // 2. Extract Token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Database Lookup with Error Handling
      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true },
        });
      } catch (dbError) {
        console.error('DATABASE ERROR in authMiddleware:', dbError.message);
        res.status(500);
        throw new Error('Database connection failed during authentication.');
      }

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
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no session token found');
  }
});

module.exports = { protect };
