const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    res.status(500);
    throw new Error('JWT_SECRET is not configured');
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Look up the real user from the database (exclude password)
      const user = await prisma.user.findUnique({
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
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
