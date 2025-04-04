const axios = require('axios');
const { GROQ_API_KEY, GROQ_API_URL, GROQ_API_MODEL } = require('../config/groqConfig');

const conversationCache = new Map();

const detectLanguage = (text) => {
  if (!text || text.trim() === '') return 'tr';
  
  const turkishChars = 'çğıöşüÇĞİÖŞÜ';
  const containsTurkishChars = [...text].some(char => turkishChars.includes(char));
  
  if (containsTurkishChars) {
    return 'tr';
  }

  const turkishWords = [
    'merhaba', 'selam', 'nasılsın', 'naber', 'evet', 'hayır', 
    'lütfen', 'teşekkür', 'tamam', 've', 'bir', 'için', 
    'bu', 'şu', 'ne', 'kim', 'nerede', 'nasıl', 'neden', 
    'çünkü', 'ama', 'fakat', 'ile', 'veya', 'ya da'
  ];
  
  const cleanText = text.toLowerCase().replace(/[0-9.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const words = cleanText.split(/\s+/);
  
  const turkishWordCount = words.filter(word => 
    turkishWords.includes(word)
  ).length;
  
  if (turkishWordCount / words.length >= 0.15) {
    return 'tr';
  }
  
  return 'en';
};

const sendToGroq = async (userMessage, sessionId = 'default', language = null, customPrompt = '') => {
  try {
    const detectedLanguage = language || detectLanguage(userMessage);
    
    if (!conversationCache.has(sessionId)) {
      conversationCache.set(sessionId, []);
    }
    
    const conversationHistory = conversationCache.get(sessionId);
    

    if (conversationHistory.length > 9) {
      conversationHistory.splice(0, conversationHistory.length - 8);
    }

    conversationHistory.push({
      role: "user",
      content: userMessage
    });
    
    let systemInstruction;
    if (detectedLanguage === 'tr') {
      systemInstruction = "Sen yardımcı bir yapay zeka asistanısın. Kullanıcı Türkçe sorduğunda Türkçe, İngilizce sorduğunda İngilizce yanıt vermelisin. Türkçe yanıtlarında doğal ve akıcı bir dil kullanmaya özen göster. Nazik, bilgilendirici ve yararlı yanıtlar sun.";
      
      if (customPrompt) {
        systemInstruction += ` ${customPrompt}`;
      }
    } else {
      systemInstruction = "You are a helpful AI assistant. Respond in English when the user writes in English, and in Turkish when they write in Turkish. Ensure your Turkish responses are natural and fluent. Be polite, informative, and helpful in your responses.";
      
      if (customPrompt) {
        systemInstruction += ` ${customPrompt}`;
      }
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
        max_tokens: 1000,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botResponse = response.data.choices[0].message.content;
    conversationHistory.push({
      role: "assistant",
      content: botResponse
    });
    
    return botResponse;
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    
    if (error.response) {
        if (error.response.status === 429) {
            throw new Error('Çok fazla istek gönderildi. Lütfen biraz bekleyin ve tekrar deneyin.');
        } else if (error.response.status === 400) {
            throw new Error('Geçersiz istek: ' + (error.response.data?.error?.message || 'Bilinmeyen hata'));
        } else if (error.response.status === 401) {
            throw new Error('API anahtarı geçersiz veya eksik. Lütfen yapılandırma dosyanızı kontrol edin.');
        } else if (error.response.status >= 500) {
            throw new Error('Groq sunucularında bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
    
    throw new Error(error.response?.data?.error?.message || 'Groq API ile iletişim sırasında bir hata oluştu');
  }
};

module.exports = { sendToGroq };