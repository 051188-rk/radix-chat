const authService = require("../services/authService");

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.validated.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.validated.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { signup, login };
