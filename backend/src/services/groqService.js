const axios = require('axios');
const { GROQ_API_KEY, GROQ_API_URL, GROQ_API_MODEL } = require('../config/groqConfig');

const conversationCache = new Map();

const sendToGroq = async (userMessage, sessionId = 'default', language = null) => {
  try {
    const detectedLanguage = language || detectLanguage(userMessage);
    
    if (!conversationCache.has(sessionId)) {
      conversationCache.set(sessionId, []);
    }
    
    const conversationHistory = conversationCache.get(sessionId);
    
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, 2);
    }
    
    conversationHistory.push({
      role: "user",
      content: userMessage
    });
    
    let systemInstruction;
    if (detectedLanguage === 'tr') {
      systemInstruction = "Sen yardımcı bir yapay zeka asistanısın. Kullanıcı Türkçe sorduğunda Türkçe, İngilizce sorduğunda İngilizce yanıt vermelisin. Türkçe yanıtlarında doğal ve akıcı bir dil kullanmaya özen göster. Nazik, bilgilendirici ve yararlı yanıtlar sun.";
    } else {
      systemInstruction = "You are a helpful AI assistant. Respond in English when the user writes in English, and in Turkish when they write in Turkish. Ensure your Turkish responses are natural and fluent. Be polite, informative, and helpful in your responses.";
    }
    
    const messages = [
      {
        role: "system",
        content: systemInstruction
      },
      ...conversationHistory
    ];
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_API_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const botResponse = response.data.choices[0].message.content;

    conversationHistory.push({
      role: "assistant",
      content: botResponse
    });

    conversationCache.set(sessionId, conversationHistory);
    
    return botResponse;
  } catch (error) {
    console.error('Groq API hatası:', error.response?.data || error.message);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Groq API yanıt vermedi, lütfen daha sonra tekrar deneyin.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Çok fazla istek gönderildi, lütfen biraz bekleyin.');
    }
    
    throw new Error('Groq API ile iletişim kurarken bir hata oluştu');
  }
};

function detectLanguage(text) {
  const turkishChars = /[şŞğĞüÜıİöÖçÇ]/;
  
  const turkishWords = /\b(ve|için|ile|bu|bir|merhaba|selam|nasıl|evet|hayır)\b/i;
  
  if (turkishChars.test(text) || turkishWords.test(text)) {
    return 'tr';
  }
  
  return 'en';
}

module.exports = { sendToGroq };