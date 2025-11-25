const ChatMessage = require('../models/ChatMessage');
const aiService = require('../services/aiService');

// Process chat message
exports.processChatMessage = async (req, res) => {
  try {
    const { message, emailContext } = req.body;
    
    // Use AI service to generate response
    const aiResponse = await aiService.generateChatResponse(message, emailContext);
    
    res.json({
      response: aiResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const { emailId } = req.params;
    
    const chatHistory = await ChatMessage.find({ emailId })
      .sort({ timestamp: 1 });
    
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};