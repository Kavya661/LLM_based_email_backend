const { Mistral } = require("@mistralai/mistralai");

class MistralService {
  constructor() {
    // Initialize Mistral client with API key from environment variables
    this.client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY || "FyRFJaAv0ZhzEf1U1SC8hFuScgZYJsJ9",
    });
  }

  // Email summarization using Mistral AI
  async summarizeEmail(email) {
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
      
      const response = await this.client.chat.complete({
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: "You are an email summarization assistant. You analyze emails and provide concise summaries with key points. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 200
      });
      
      try {
        // Extract JSON from response content
        const content = response.choices[0].message.content.trim();
        // Try to find JSON object in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing email summary from Mistral:', parseError);
        console.error('Raw response:', response.choices[0].message.content);
        return {
          summary: "Email summary could not be parsed.",
          keyPoints: ["Error occurred while processing the email summary."]
        };
      }
    } catch (error) {
      console.error('Error summarizing email with Mistral:', error);
      throw error;
    }
  }

  // Email categorization using Mistral AI
  async categorizeEmail(email) {
    try {
      const prompt = `Categorize the following email into one of these categories: Important, Newsletter, Spam, To-Do.
      
      Sender: ${email.sender?.name || email.sender} <${email.sender?.email || ''}>
      Subject: ${email.subject}
      Body: ${email.body}
      
      Respond with only the category name from the provided list.`;
      
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an email categorization assistant. You analyze emails and categorize them accurately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 10
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error categorizing email with Mistral:', error);
      // Return a default category if AI fails
      return 'To-Do';
    }
  }

  // Action-item extraction using Mistral AI
  async extractActionItems(email) {
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
      
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an action item extraction assistant. You analyze emails and extract actionable items in JSON format. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 200
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
        console.error('Error parsing action items from Mistral:', parseError);
        console.error('Raw response:', response.choices[0].message.content);
        return [];
      }
    } catch (error) {
      console.error('Error extracting action items with Mistral:', error);
      // Return empty array to let the AI service fall back to OpenAI
      throw error;
    }
  }

  // Auto-draft replies using Mistral AI
  async draftReply(email) {
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

      const purposeResponse = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an email analysis assistant. Identify the primary purpose of emails accurately."
          },
          {
            role: "user",
            content: purposePrompt
          }
        ],
        temperature: 0.3,
        maxTokens: 20
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

      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an email reply assistant. You create professional, concise email replies that are context-aware and purpose-specific. Output only the reply text that should appear in the editor, preserving line breaks so it can be shown directly in the reply box. Do not include any subject lines, headers, or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        maxTokens: 300
      });

      // Return only the reply body text as requested
      const replyBody = response.choices[0].message.content.trim();
      
      return {
        subject: `Re: ${email.subject}`,
        body: replyBody,
        timestamp: new Date(),
        purpose: emailPurpose
      };
    } catch (error) {
      console.error('Error drafting reply with Mistral:', error);
      return {
        subject: `Re: ${email.subject}`,
        body: 'Thank you for your email.',
        timestamp: new Date(),
        purpose: 'General'
      };
    }
  }

  // Chat-based inbox interaction using Mistral AI
  async generateChatResponse(message, emailContext) {
    try {
      const prompt = `You are an email productivity assistant helping a user manage their inbox. 
      The user is asking about an email with the following context:
      
      Subject: ${emailContext.subject}
      Body: ${emailContext.body}
      
      User message: ${message}
      
      Provide a helpful and concise response.`;
      
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an email productivity assistant. Help users manage their inbox effectively."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: 300
      });
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating chat response with Mistral:', error);
      return "I'm sorry, I'm having trouble processing your request right now.";
    }
  }

  // Simple action item extraction - one line per action
  async extractSimpleActionItems(email) {
    try {
      const prompt = `Read the following email and identify the required action(s).
Return each action as a simple one-line statement.

Email Content:
"""
${email.body}
"""`;
      
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are an action item extraction assistant. Extract actionable items from emails as simple one-line statements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        maxTokens: 200
      });
      
      // Split the response into lines and filter out empty lines
      const actions = response.choices[0].message.content
        .split('\n')
        .map(action => action.trim())
        .filter(action => action.length > 0);
      
      // Convert to the expected format (array of action items)
      return actions.map(action => ({
        action_required: action,
        completed: false
      }));
    } catch (error) {
      console.error('Error extracting simple action items with Mistral:', error);
      throw error;
    }
  }

  // Start a conversation with a specific agent
  async startAgentConversation(agentId, inputs) {
    try {
      const response = await this.client.beta.conversations.start({
        agentId: agentId,
        inputs: inputs,
      });
      return response;
    } catch (error) {
      console.error('Error starting agent conversation with Mistral:', error);
      throw error;
    }
  }
}

module.exports = new MistralService();