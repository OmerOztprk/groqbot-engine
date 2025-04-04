const { sendToGroq } = require("../services/groqService");
const { v4: uuidv4 } = require("uuid");

const activeSessions = {};

const cleanupInactiveSessions = () => {
  const now = new Date();
  const expirationTime = 24 * 60 * 60 * 1000;
  let cleanedCount = 0;

  Object.keys(activeSessions).forEach((sessionId) => {
    const session = activeSessions[sessionId];
    const timeDiff = now - session.lastActivity;

    if (timeDiff > expirationTime) {
      delete activeSessions[sessionId];
      cleanedCount++;
    }
  });

  console.log(`${cleanedCount} eski oturum temizlendi`);
  return cleanedCount;
};

const handleChat = async (req, res, next) => {
  try {
    const {
      userMessage,
      sessionId = null,
      customPrompt = "",
      fileInfo = null,
    } = req.body;

    if (!userMessage) {
      return res
        .status(400)
        .json({ success: false, message: "userMessage eksik" });
    }

    const currentSessionId = sessionId || uuidv4();

    if (!activeSessions[currentSessionId]) {
      activeSessions[currentSessionId] = {
        createdAt: new Date(),
        lastActivity: new Date(),
        customPrompt: customPrompt,
      };
    } else {
      activeSessions[currentSessionId].lastActivity = new Date();
      if (customPrompt !== undefined) {
        activeSessions[currentSessionId].customPrompt = customPrompt;
      }
    }

    // Dosya içeriğini işle
    let processedMessage = userMessage;
    if (fileInfo && fileInfo.content) {
      // Dosya içeriğini mesaja ekle
      processedMessage = `${userMessage}\n\nDosya İçeriği:\n${fileInfo.content}`;
      console.log(
        "Dosya içeriği işlendi, ilk 50 karakter:",
        fileInfo.content.substring(0, 50) + "..."
      );
    }

    const response = await sendToGroq(
      processedMessage, // userMessage yerine processedMessage gönderiyoruz
      currentSessionId,
      null,
      activeSessions[currentSessionId].customPrompt
    );

    res.json({
      success: true,
      response,
      sessionId: currentSessionId,
    });

    if (!global.requestCounter) {
      global.requestCounter = 0;
    }

    global.requestCounter++;

    if (global.requestCounter >= 100) {
      cleanupInactiveSessions();
      global.requestCounter = 0;
    }
  } catch (error) {
    console.error("Chat hatası:", error);

    const errorMessage = error.message || "Bir hata oluştu";

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

module.exports = { handleChat, cleanupInactiveSessions };
