const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');

const protect = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    res.status(401);
    throw new Error('Not authorized, no session token found');
  }

  const token = req.headers.authorization.split(' ')[1];

  // Config check runs before JWT verify so misconfiguration surfaces as 500, not 401
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('CRITICAL: JWT_SECRET is missing or too short (min 32 chars).');
    res.status(500);
    throw new Error('Server Configuration Error: JWT_SECRET is not properly configured.');
  }

  // Fix: Only catch JWT-specific errors here. Previously the broad try/catch
  // also swallowed Prisma/DB errors (connection timeouts, etc.) and re-threw
  // them as generic 401 "token validation failed", masking real 500 conditions
  // and eating the more specific "user not found" message.
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Session expired, please login again');
    }
    console.error('AUTH ERROR (JWT):', error.message);
    throw new Error('Not authorized, token validation failed');
  }

  // DB errors propagate naturally from here as 500s
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
});

module.exports = { protect };