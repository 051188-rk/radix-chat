const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function signup({ username, email, password }) {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });
  const token = signToken(user);
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email }
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email }
  };
}

module.exports = { signup, login };
