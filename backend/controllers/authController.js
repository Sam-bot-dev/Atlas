const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const admin = require('../lib/firebaseAdmin');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeName = (name = '') => String(name).trim();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generate CSRF token for response headers
const generateCsrfToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
      isFirebaseUser: false,
    },
  });

  sendAuthResponse(res, user);
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

  if (user && user.password && (await bcrypt.compare(password, user.password))) {
    sendAuthResponse(res, user);
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

  // Include CSRF token for subsequent state-changing requests
  const csrfToken = generateCsrfToken();
  res.setHeader('X-CSRF-Token', csrfToken);

  res.json({ _id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// Generate JWT
const generateToken = (id, email) => {
  assertJwtSecret();
  // Fix #4: reduced expiry from 30d to 7d for better security hygiene
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const sendAuthResponse = (res, user) => {
  const token = generateToken(user.id, user.email);
  const csrfToken = generateCsrfToken();
  res.setHeader('X-CSRF-Token', csrfToken);
  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token,
  });
};

const logoutUser = asyncHandler(async (req, res) => {
  res.json({ success: true });
});

// @desc    Authenticate with Firebase ID Token
// @route   POST /api/v1/auth/firebase
// @access  Public
const firebaseLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error('Firebase ID token is required');
  }

  // 1. Verify Token with Firebase Admin
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error('Firebase Admin verifyIdToken error:', err.message);
    if (err.message.includes('not configured') || err.message.includes('Init failed')) {
      res.status(503);
      throw new Error('Firebase authentication is not configured on the server');
    }
    res.status(401);
    throw new Error('Invalid Firebase token');
  }

  if (!decoded.email) {
    res.status(400);
    throw new Error('Firebase user does not have an email');
  }

  // 2. See if user exists in our local Prisma DB by email
  let user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  // 3. If Google Auth new user, create them in Prisma
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: decoded.email,
        name: decoded.name || 'Google User',
        password: null,
        isFirebaseUser: true,
      }
    });
  }

  sendAuthResponse(res, user);
});

// @desc    Update current user profile (name)
// @route   PATCH /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const name = normalizeName(req.body.name || '');
  if (!name || name.length > 80) {
    res.status(400);
    throw new Error('Name must be between 1 and 80 characters');
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  // Update session cache key so TopBar reflects the new name immediately
  res.json({ _id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
});

// @desc    Delete current user account and all data (cascades via DB)
// @route   DELETE /api/v1/auth/me
// @access  Private
const deleteMe = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.user.id } });
  res.json({ deleted: true });
});

module.exports = {
  signupUser,
  loginUser,
  getMe,
  updateMe,
  deleteMe,
  logoutUser,
  firebaseLogin,
};
