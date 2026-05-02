const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeName = (name = '') => String(name).trim();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
};

// @desc    Register new user
// @route   POST /api/v1/auth/signup
// @access  Public
const signupUser = asyncHandler(async (req, res) => {
  const name = normalizeName(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  if (name.length > 80 || !emailPattern.test(email) || email.length > 254 || password.length < 8 || password.length > 256) {
    res.status(400);
    throw new Error('Use a valid email, name under 80 characters, and password between 8 and 256 characters');
  }

  // Check if user exists
  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id, user.email),
  });
});

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Check for user email
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id, user.email),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ _id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// Generate JWT
const generateToken = (id, email) => {
  assertJwtSecret();
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const logoutUser = asyncHandler(async (req, res) => {
  res.json({ success: true });
});

module.exports = {
  signupUser,
  loginUser,
  getMe,
  logoutUser,
};
