const ChatMessage = require('../models/ChatMessage');
const aiService = require('./aiService');

exports.processChatMessage = async (emailId, message) => {
  try {
    // Save user message
    const userMessage = new ChatMessage({
      emailId,
      role: 'user',
      content: message
    });
    await userMessage.save();
    
    // Get email context
    // In a real implementation, you would fetch the actual email
    // For now, we'll simulate with mock data
    const emailContext = {
      subject: 'Sample Email Subject',
      body: 'This is a sample email body for context.'
    };
    
    // Use AI service to generate response
    const aiResponse = await aiService.generateChatResponse(message, emailContext);
    
    // Save AI response
    const assistantMessage = new ChatMessage({
      emailId,
      role: 'assistant',
      content: aiResponse
    });
    await assistantMessage.save();
    
    return {
      userMessage,
      assistantMessage
    };
  } catch (error) {
    throw new Error(error.message);
  }
};