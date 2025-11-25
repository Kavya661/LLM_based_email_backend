// AI Configuration
require('dotenv').config();

const config = {
  openai: {
    apiKey: process.env.MISTRAL_API_KEY|| '',
    model: process.env.MISTRAL_MODE || 'mistral-small-latest',
  },
  // Add other AI service configurations here if needed
};

module.exports = config;