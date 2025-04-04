require('dotenv').config();

module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_MODEL: 'llama3-8b-8192',
};
