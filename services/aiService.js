const OpenAI = require('openai');
const config = require('../config/aiConfig');
const mistralService = require('./mistralService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

class AIService {
  // Email summarization
  async summarizeEmail(email) {
    try {
      // Use Mistral AI for email summarization
      return await mistralService.summarizeEmail(email);
    } catch (error) {
      console.error('Error summarizing email with Mistral, falling back to OpenAI:', error);
      try {
        const prompt = `Summarize the following email in a few key points. Highlight the main questions, requests, or important information.
        
        Sender: ${email.sender?.name || email.sender} <${email.sender?.email || ''}>
        Subject: ${email.subject}
        Body: ${email.body}
        
        Respond with a JSON object containing:
        {
          "summary": "A brief overall summary of the email",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
        }`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email summarization assistant. You analyze emails and provide concise summaries with key points.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        });

        try {
          return JSON.parse(response.choices[0].message.content.trim());
        } catch (parseError) {
          console.error('Error parsing email summary:', parseError);
          return {
            summary: "Email summary could not be parsed.",
            keyPoints: ["Error occurred while processing the email summary."]
          };
        }
      } catch (openaiError) {
        console.error('Error summarizing email with OpenAI:', openaiError);
        return {
          summary: "This email requires your attention.",
          keyPoints: ["Email content processed.", "Please review manually."]
        };
      }
    }
  }

  // Email categorization
  async categorizeEmail(email) {
    try {
      // Use Mistral AI for categorization
      return await mistralService.categorizeEmail(email);
    } catch (error) {
      console.error('Error categorizing email with Mistral, falling back to OpenAI:', error);
      try {
        const prompt = `Categorize the following email into one of these categories: Important, Newsletter, Spam, To-Do.
        
        Sender: ${email.sender?.name || email.sender} <${email.sender?.email || ''}>
        Subject: ${email.subject}
        Body: ${email.body}
        
        Respond with only the category name.`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email categorization assistant. You analyze emails and categorize them accurately.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 10
        });

        return response.choices[0].message.content.trim();
      } catch (openaiError) {
        console.error('Error categorizing email with OpenAI:', openaiError);
        // Return a default category if both AI services fail
        return 'To-Do';
      }
    }
  }

  // Action-item extraction
  async extractActionItems(email) {
    try {
      // Use Mistral AI for action item extraction
      return await mistralService.extractSimpleActionItems(email);
    } catch (error) {
      console.error('Error extracting action items with Mistral, falling back to OpenAI:', error);
      try {
        const prompt = `Read the following email and identify the required action(s).
Return the result only in JSON format with the keys:
- "action_required": A short clear statement of what needs to be done.
- "requested_time": If any date/time is mentioned.
- "from": the name or email of the sender.
- "confirmation_needed": yes or no.

Email Content:
"""
${email.body}
"""`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an action item extraction assistant. You analyze emails and extract actionable items in JSON format. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        });

        try {
          // Extract JSON from response content
          const content = response.choices[0].message.content.trim();
          // Try to find JSON object in the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonString);
          // Add completed field with default value false
          result.completed = false;
          // Convert to the expected format (array of action items)
          return [result];
        } catch (parseError) {
          console.error('Error parsing action items:', parseError);
          console.error('Raw response:', response.choices[0].message.content);
          return [];
        }
      } catch (openaiError) {
        console.error('Error extracting action items with OpenAI:', openaiError);
        return [];
      }
    }
  }

  // Auto-draft replies
  async draftReply(email) {
    try {
      // Use Mistral AI for draft replies
      return await mistralService.draftReply(email);
    } catch (error) {
      console.error('Error drafting reply with Mistral, falling back to OpenAI:', error);
      try {
        // Analyze email purpose to create context-aware reply
        const purposePrompt = `Analyze the following email and determine its primary purpose. Choose from these categories:
        - Meeting scheduling
        - Confirmation
        - Clarification
        - Information sharing
        - Request
        - Follow-up
        - Other
        
        Email:
        From: ${email.sender?.name || email.sender} <${email.sender?.email || ''}>
        Subject: ${email.subject}
        Body: ${email.body}
        
        Respond with only the category name.`;

        const purposeResponse = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email analysis assistant. Identify the primary purpose of emails accurately.'
            },
            {
              role: 'user',
              content: purposePrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 20
        });

        const emailPurpose = purposeResponse.choices[0].message.content.trim();

        // Generate context-aware draft based on purpose
        let purposeInstructions = "";
        switch (emailPurpose.toLowerCase()) {
          case "meeting scheduling":
            purposeInstructions = "This is a meeting scheduling email. Respond with availability suggestions and confirmation details.";
            break;
          case "confirmation":
            purposeInstructions = "This is a confirmation email. Acknowledge receipt and confirm understanding.";
            break;
          case "clarification":
            purposeInstructions = "This is a clarification request. Provide clear and detailed answers to the questions asked.";
            break;
          case "information sharing":
            purposeInstructions = "This is an informational email. Acknowledge receipt and summarize key points if needed.";
            break;
          case "request":
            purposeInstructions = "This is a request email. Address each request specifically and provide clear responses.";
            break;
          case "follow-up":
            purposeInstructions = "This is a follow-up email. Reference previous communications and provide requested updates.";
            break;
          default:
            purposeInstructions = "Create a professional and appropriate response based on the email content.";
        }

        const prompt = `You are an email reply assistant inside a conversation view, where the full email thread is displayed above and a reply editor section appears directly below it with actions like Reply, Reply all, Forward, and Discard. When the user clicks the "Draft reply" button, read the entire visible conversation (including the latest message) and generate a clear, polite reply body based on that context; do not change or suggest any email addresses, as the To field is already set to the correct recipient. Output only the reply text that should appear in the editor, preserving line breaks so it can be shown directly in the reply box, and leave it to the user to either send or discard the draft using the UI controls.
        
        Email Purpose: ${emailPurpose}
        Special Instructions: ${purposeInstructions}
        
        Original Email:
        From: ${email.sender?.name || email.sender} <${email.sender?.email || ''}>
        Subject: ${email.subject}
        Body: ${email.body}`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email reply assistant. You create professional, concise email replies that are context-aware and purpose-specific. Output only the reply text that should appear in the editor, preserving line breaks so it can be shown directly in the reply box. Do not include any subject lines, headers, or explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        });

        // Return only the reply body text as requested
        const replyBody = response.choices[0].message.content.trim();
        
        return {
          subject: `Re: ${email.subject}`,
          body: replyBody,
          timestamp: new Date(),
          purpose: emailPurpose
        };
      } catch (openaiError) {
        console.error('Error drafting reply with OpenAI:', openaiError);
        return {
          subject: `Re: ${email.subject}`,
          body: 'Thank you for your email.',
          timestamp: new Date(),
          purpose: 'General'
        };
      }
    }
  }

  // Chat-based inbox interaction
  async generateChatResponse(message, emailContext) {
    try {
      // Use Mistral AI for chat responses
      return await mistralService.generateChatResponse(message, emailContext);
    } catch (error) {
      console.error('Error generating chat response with Mistral, falling back to OpenAI:', error);
      try {
        const prompt = `You are an email productivity assistant helping a user manage their inbox. 
        The user is asking about an email with the following context:
        
        Subject: ${emailContext.subject}
        Body: ${emailContext.body}
        
        User message: ${message}
        
        Provide a helpful and concise response.`;

        const response = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email productivity assistant. Help users manage their inbox effectively.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        });

        return response.choices[0].message.content.trim();
      } catch (openaiError) {
        console.error('Error generating chat response with OpenAI:', openaiError);
        return "I'm sorry, I'm having trouble processing your request right now.";
      }
    }
  }

  // Start a conversation with a specific Mistral agent
  async startAgentConversation(agentId, inputs) {
    try {
      return await mistralService.startAgentConversation(agentId, inputs);
    } catch (error) {
      console.error('Error starting agent conversation:', error);
      throw error;
    }
  }
}

module.exports = new AIService();