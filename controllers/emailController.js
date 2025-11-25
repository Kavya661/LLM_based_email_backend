const Email = require('../models/Email');

// Get draft emails
// Note: Draft emails should also include starred ones
exports.getDraftEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { parentId } = req.query; // Get parentId from query parameters
    
    // Build query filter
    const filter = { 
      "sender.email": userEmail,
      isDraft: true,
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    };
    
    // If parentId is provided, filter by it
    if (parentId) {
      filter.parentId = parentId;
    }
    
    const emails = await Email.find(filter)
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mock email inbox
exports.getMockInbox = (req, res) => {
  const mockEmails = [
    {
      id: '1',
      sender: { name: 'John Doe', email: 'john@example.com' },
      subject: 'Meeting Tomorrow',
      body: 'Hi, just wanted to confirm our meeting tomorrow at 10am.',
      timestamp: new Date(),
      read: false,
      starred: false
    },
    {
      id: '2',
      sender: { name: 'Jane Smith', email: 'jane@example.com' },
      subject: 'Project Update',
      body: 'Here is the latest update on the project.',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
      starred: true
    }
  ];
  
  res.json(mockEmails);
};

// Get all emails
exports.getAllEmails = async (req, res) => {
  try {
    const emails = await Email.find({ deleted: { $ne: true } }) // Exclude deleted emails
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get inbox emails (where the user is a recipient)
// Note: Inbox should show ALL emails that are received, including starred ones
exports.getInboxEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('Getting inbox emails for user:', userEmail);
    
    const emails = await Email.find({ 
      "recipients.email": userEmail,
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail }, // Exclude emails permanently deleted by this user
      archived: { $ne: true }, // Exclude archived emails
      isDraft: { $ne: true } // Exclude draft emails
    })
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: -1 });
    
    console.log('Found emails:', emails.length);
    res.json(emails);
  } catch (error) {
    console.error('Error in getInboxEmails:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get trash emails
exports.getTrashEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const emails = await Email.find({ 
      $or: [
        { "recipients.email": userEmail },
        { "sender.email": userEmail }
      ],
      trashedBy: userEmail, // Only emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    })
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sent emails (where the user is the sender)
// Note: Sent emails should also include starred ones
exports.getSentEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { parentId } = req.query; // Get parentId from query parameters
    
    // Build query filter
    const filter = { 
      "sender.email": userEmail,
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail }, // Exclude emails permanently deleted by this user
      isDraft: false, // Exclude draft emails
    };
    
    // If parentId is provided, filter by it
    if (parentId) {
      filter.parentId = parentId;
    }
    
    const emails = await Email.find(filter)
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get starred emails
exports.getStarredEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const emails = await Email.find({ 
      $or: [
        { "recipients.email": userEmail },
        { "sender.email": userEmail }
      ],
      starred: true,
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    })
    .populate('sender', 'name email')
    .populate('recipients', 'name email')
    .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get newsletter emails
exports.getNewsletterEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const emails = await Email.find({ 
      $or: [
        { "recipients.email": userEmail },
        { "sender.email": userEmail }
      ],
      category: 'Newsletter',
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    })
    .populate('sender', 'name email')
    .populate('recipients', 'name email')
    .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get spam emails
exports.getSpamEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const emails = await Email.find({ 
      $or: [
        { "recipients.email": userEmail },
        { "sender.email": userEmail }
      ],
      category: 'Spam',
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    })
    .populate('sender', 'name email')
    .populate('recipients', 'name email')
    .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get todo emails
exports.getTodoEmails = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const emails = await Email.find({ 
      $or: [
        { "recipients.email": userEmail },
        { "sender.email": userEmail }
      ],
      category: 'To-Do',
      trashedBy: { $ne: userEmail }, // Exclude emails trashed by this user
      permanentlyDeletedBy: { $ne: userEmail } // Exclude emails permanently deleted by this user
    })
    .populate('sender', 'name email')
    .populate('recipients', 'name email')
    .sort({ timestamp: -1 });
    
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get email by ID
exports.getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id)
      .populate('sender', 'name email')
      .populate('recipients', 'name email');
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to access this email' });
    }
    
    // Check if user has permanently deleted this email
    if (email.permanentlyDeletedBy.includes(userEmail)) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update email read status
exports.updateEmailReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to update this email' });
    }
    
    email.read = read;
    await email.save();
    
    res.json({ message: 'Email read status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle email star status
exports.toggleEmailStar = async (req, res) => {
  try {
    const { id } = req.params;
    const { starred } = req.body;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to update this email' });
    }
    
    email.starred = starred;
    await email.save();
    
    res.json({ message: 'Email star status updated successfully', starred: email.starred });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive email
exports.archiveEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to archive this email' });
    }
    
    email.archived = true;
    await email.save();
    
    res.json({ message: 'Email archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Move email to trash
exports.moveEmailToTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to delete this email' });
    }
    
    // Add user to trashedBy array if not already there
    if (!email.trashedBy.includes(userEmail)) {
      email.trashedBy.push(userEmail);
    }
    
    await email.save();
    
    res.json({ message: 'Email moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Permanently delete email
exports.permanentlyDeleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to delete this email' });
    }
    
    // Add user to permanentlyDeletedBy array
    if (!email.permanentlyDeletedBy.includes(userEmail)) {
      email.permanentlyDeletedBy.push(userEmail);
    }
    
    // If all users who have access to this email have permanently deleted it, remove the document
    const allUsersWithAccess = [
      email.sender.email,
      ...email.recipients.map(recipient => recipient.email)
    ];
    
    const allDeleted = allUsersWithAccess.every(userEmail => 
      email.permanentlyDeletedBy.includes(userEmail)
    );
    
    if (allDeleted) {
      await Email.findByIdAndDelete(id);
    } else {
      await email.save();
    }
    
    res.json({ message: 'Email permanently deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore email from trash
exports.restoreEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check if user has access to this email
    const isSender = email.sender.email === userEmail;
    const isRecipient = email.recipients.some(recipient => recipient.email === userEmail);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to restore this email' });
    }
    
    // Remove user from trashedBy array
    email.trashedBy = email.trashedBy.filter(email => email !== userEmail);
    
    await email.save();
    
    res.json({ message: 'Email restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Email summarization
exports.summarizeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use AI service to summarize email
    const aiService = require('../services/aiService');
    const summary = await aiService.summarizeEmail(email);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Email categorization
exports.categorizeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use AI service to categorize email
    const aiService = require('../services/aiService');
    const category = await aiService.categorizeEmail(email);
    
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Action-item extraction
exports.extractActionItems = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use AI service to extract action items
    const aiService = require('../services/aiService');
    const actionItems = await aiService.extractActionItems(email);
    
    // Ensure each action item has a completed field
    const actionItemsWithCompleted = actionItems.map(item => ({
      ...item,
      completed: item.completed !== undefined ? item.completed : false
    }));
    
    res.json({ actionItems: actionItemsWithCompleted });
  } catch (error) {
    console.error('Error extracting action items:', error);
    res.status(500).json({ message: error.message });
  }
};

// Simple action-item extraction
exports.extractSimpleActionItems = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use Mistral service directly for simple action item extraction
    const mistralService = require('../services/mistralService');
    const actionItems = await mistralService.extractSimpleActionItems(email);
    
    // Ensure each action item has a completed field
    const actionItemsWithCompleted = actionItems.map(item => ({
      ...item,
      completed: item.completed !== undefined ? item.completed : false
    }));
    
    res.json({ actionItems: actionItemsWithCompleted });
  } catch (error) {
    console.error('Error extracting simple action items:', error);
    res.status(500).json({ message: error.message });
  }
};

// Save action items to email
exports.saveActionItems = async (req, res) => {
  try {
    const { emailId, actionItems } = req.body;
    
    // Ensure each action item has a completed field
    const actionItemsWithCompleted = actionItems.map(item => ({
      ...item,
      completed: item.completed !== undefined ? item.completed : false
    }));
    
    // Find and update the email with action items
    const email = await Email.findByIdAndUpdate(
      emailId,
      { actionItems: actionItemsWithCompleted },
      { new: true }
    ).populate('sender', 'name email')
     .populate('recipients', 'name email');
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ message: 'Action items saved successfully', email });
  } catch (error) {
    console.error('Error saving action items:', error);
    res.status(500).json({ message: error.message });
  }
};

// Auto-draft replies
exports.draftReply = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Use AI service to generate a draft reply
    const aiService = require('../services/aiService');
    const draftReply = await aiService.draftReply(email);
    
    res.json({ draftReply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create reply draft for a specific email
exports.createReplyDraft = async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userInstruction } = req.body || {};
    const userEmail = req.user.email;
    const userName = req.user.name;
    
    // Get the original email and its thread
    const originalEmail = await Email.findById(emailId)
      .populate('sender', 'name email')
      .populate('recipients', 'name email');
    
    if (!originalEmail) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Use AI service to generate an intelligent draft reply
    const aiService = require('../services/aiService');
    const aiGeneratedDraft = await aiService.draftReply(originalEmail);
    
    // Create draft email with AI-generated content
    const draftEmail = new Email({
      sender: {
        name: userName,
        email: userEmail
      },
      recipients: [originalEmail.sender], // Reply to sender by default
      subject: aiGeneratedDraft.subject,
      body: aiGeneratedDraft.body,
      isDraft: true,
      read: true // Drafts are considered "read" by default
    });
    
    const savedDraft = await draftEmail.save();
    res.status(201).json(savedDraft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create draft
exports.createDraft = async (req, res) => {
  try {
    const { subject, body, recipients, parentId } = req.body;
    const userEmail = req.user.email;
    const userName = req.user.name;
    
    const draftEmail = new Email({
      sender: {
        name: userName,
        email: userEmail
      },
      recipients: recipients || [],
      subject: subject || '(No subject)',
      body: body || '',
      parentId: parentId || null, // Add parentId if provided
      isDraft: true,
      read: true // Drafts are considered "read" by default
    });
    
    const savedDraft = await draftEmail.save();
    res.status(201).json(savedDraft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a conversation with a Mistral agent
exports.startAgentConversation = async (req, res) => {
  try {
    const { agentId, inputs } = req.body;
    
    // Use AI service to start agent conversation
    const aiService = require('../services/aiService');
    const response = await aiService.startAgentConversation(agentId, inputs);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update draft
exports.updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body, recipients, parentId } = req.body;
    const userEmail = req.user.email;
    
    const draft = await Email.findById(id);
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    if (draft.sender.email !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to update this draft' });
    }
    
    if (!draft.isDraft) {
      return res.status(400).json({ message: 'Email is not a draft' });
    }
    
    draft.subject = subject || draft.subject;
    draft.body = body || draft.body;
    draft.recipients = recipients || draft.recipients;
    // Update parentId if provided
    if (parentId !== undefined) {
      draft.parentId = parentId;
    }
    
    const updatedDraft = await draft.save();
    res.json(updatedDraft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete draft (move to trash)
exports.deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const draft = await Email.findById(id);
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    // Check if user is the sender of the draft
    if (draft.sender.email !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to delete this draft' });
    }
    
    // Check if it's actually a draft
    if (!draft.isDraft) {
      return res.status(400).json({ message: 'Email is not a draft' });
    }
    
    // Add user to trashedBy array
    if (!draft.trashedBy.includes(userEmail)) {
      draft.trashedBy.push(userEmail);
    }
    
    await draft.save();
    
    res.json({ message: 'Draft moved to trash' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send draft
exports.sendDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const userName = req.user.name;
    
    // Find the draft
    const draft = await Email.findById(id);
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    if (draft.sender.email !== userEmail) {
      return res.status(403).json({ message: 'Not authorized to send this draft' });
    }
    
    // Update the draft to mark it as sent (remove draft status)
    const sentEmail = await Email.findByIdAndUpdate(
      id,
      {
        isDraft: false,
        timestamp: new Date()
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Email sent successfully',
      email: sentEmail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create intelligent draft based on email content
exports.createIntelligentDraft = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userEmail = req.user.email;
    const userName = req.user.name;
    
    // Get the original email
    const originalEmail = await Email.findById(emailId);
    if (!originalEmail) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Use AI service to generate an intelligent draft reply
    const aiService = require('../services/aiService');
    const aiGeneratedDraft = await aiService.draftReply(originalEmail);
    
    // Create draft email with AI-generated content
    const draftEmail = new Email({
      sender: {
        name: userName,
        email: userEmail
      },
      recipients: [originalEmail.sender], // Reply to sender by default
      subject: aiGeneratedDraft.subject,
      body: aiGeneratedDraft.body,
      isDraft: true,
      read: true // Drafts are considered "read" by default
    });
    
    const savedDraft = await draftEmail.save();
    res.status(201).json(savedDraft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get email thread (both sent and received emails related to a specific email)
exports.getEmailThread = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userEmail = req.user.email;
    
    // Get the original email
    const originalEmail = await Email.findById(emailId);
    if (!originalEmail) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Find all emails in the thread (those with the same parentId or that are the parent)
    const threadEmails = await Email.find({
      $or: [
        { _id: emailId },
        { parentId: emailId },
        { _id: originalEmail.parentId },
        { parentId: originalEmail.parentId }
      ],
      deleted: { $ne: true } // Exclude deleted emails
    })
      .populate('sender', 'name email')
      .populate('recipients', 'name email')
      .sort({ timestamp: 1 }); // Chronological order
    
    res.json(threadEmails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto-categorize all inbox emails
exports.autoCategorizeInbox = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Get all unread emails in the inbox
    const emails = await Email.find({ 
      "recipients.email": userEmail,
      deleted: { $ne: true },
      archived: { $ne: true },
      isDraft: { $ne: true }
    });
    
    // Use AI service to categorize each email
    const aiService = require('../services/aiService');
    
    // Track categorization results
    const results = {
      categorized: 0,
      failed: 0
    };
    
    // Categorize each email
    for (const email of emails) {
      try {
        const category = await aiService.categorizeEmail(email);
        
        // Update the email with the new category
        email.category = category;
        await email.save();
        
        results.categorized++;
      } catch (error) {
        console.error(`Error categorizing email ${email._id}:`, error);
        results.failed++;
      }
    }
    
    res.json({ 
      message: `Categorized ${results.categorized} emails successfully. ${results.failed} emails failed.`, 
      results 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};