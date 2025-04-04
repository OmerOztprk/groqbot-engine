const { sendToGroq } = require('../services/groqService');

const handleChat = async (req, res, next) => {
  try {
    const { userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ success: false, message: 'userMessage eksik' });
    }

    const response = await sendToGroq(userMessage);

    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleChat };