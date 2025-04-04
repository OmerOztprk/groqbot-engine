const axios = require('axios');
const { GROQ_API_KEY, GROQ_API_URL, GROQ_API_MODEL } = require('../config/groqConfig');

const sendToGroq = async (userMessage) => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_API_MODEL,
        messages: [
          {
            role: "system",
            content: "Sen yardımcı bir yapay zeka asistanısın. Nazik, bilgilendirici ve yararlı yanıtlar sunarsın."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API hatası:', error.response?.data || error.message);
    throw new Error('Groq API ile iletişim kurarken bir hata oluştu');
  }
};

module.exports = { sendToGroq };