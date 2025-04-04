const { sendToGroq } = require('../services/groqService');
const { v4: uuidv4 } = require('uuid');

const activeSessions = {};

const handleChat = async (req, res, next) => {
  try {
    const { userMessage, sessionId = null } = req.body;

    if (!userMessage) {
      return res.status(400).json({ success: false, message: 'userMessage eksik' });
    }

    const currentSessionId = sessionId || uuidv4();
    
    if (!activeSessions[currentSessionId]) {
      activeSessions[currentSessionId] = { 
        createdAt: new Date(), 
        lastActivity: new Date() 
      };
    } else {
      activeSessions[currentSessionId].lastActivity = new Date();
    }

    const response = await sendToGroq(userMessage, currentSessionId);

    res.json({ 
      success: true, 
      response,
      sessionId: currentSessionId
    });
    
    if (Math.random() < 0.01) {
      cleanupInactiveSessions();
    }
    
  } catch (error) {
    console.error('Chat hatası:', error);
    
    const errorMessage = error.message || 'Bir hata oluştu';
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};

function cleanupInactiveSessions() {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  
  Object.keys(activeSessions).forEach(sessionId => {
    if (activeSessions[sessionId].lastActivity < oneHourAgo) {
      delete activeSessions[sessionId];
    }
  });
}

module.exports = { handleChat };