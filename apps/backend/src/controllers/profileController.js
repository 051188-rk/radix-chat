const { getProfileStats } = require("../services/chatService");

async function getProfile(req, res, next) {
  try {
    const profile = await getProfileStats(req.user.id);
    return res.status(200).json(profile);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile };
