const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Email summarization
router.post('/summarize', emailController.summarizeEmail);

// Email categorization
router.post('/categorize', emailController.categorizeEmail);

// Auto-categorize all inbox emails
router.post('/categorize-inbox', auth, emailController.autoCategorizeInbox);

// Action-item extraction
router.post('/extract-actions', emailController.extractActionItems);

// Simple action-item extraction
router.post('/extract-simple-actions', emailController.extractSimpleActionItems);

// Save action items to email
router.post('/save-actions', emailController.saveActionItems);

// Auto-draft replies
router.post('/draft-reply', emailController.draftReply);

// Create draft reply for a specific email (new endpoint)
router.post('/:emailId/reply-draft', auth, emailController.createReplyDraft);

// Chat-based inbox interaction
router.post('/chat/message', auth, chatController.processChatMessage);

// Start a conversation with a Mistral agent
router.post('/agent/conversation', auth, emailController.startAgentConversation);

// Create draft
router.post('/drafts', auth, emailController.createDraft);

// Create intelligent draft based on email content
router.post('/drafts/intelligent/:emailId', auth, emailController.createIntelligentDraft);

// Update draft
router.put('/drafts/:id', auth, emailController.updateDraft);

// Delete draft (move to trash)
router.delete('/drafts/:id', auth, emailController.deleteDraft);

// Send draft
router.post('/drafts/:id/send', auth, emailController.sendDraft);

// Archive email
router.put('/:id/archive', auth, emailController.archiveEmail);

// Move email to trash
router.delete('/:id/trash', auth, emailController.moveEmailToTrash);

// Permanently delete email (from trash)
router.delete('/:id', auth, emailController.permanentlyDeleteEmail);

// Restore email from trash
router.put('/:id/restore', auth, emailController.restoreEmail);

// Update email read status
router.put('/:id/read', auth, emailController.updateEmailReadStatus);

// Toggle email star status
router.put('/:id/star', auth, emailController.toggleEmailStar);

// Get all emails
router.get('/', auth, emailController.getAllEmails);

// Get inbox emails (emails where the user is a recipient)
router.get('/inbox', auth, emailController.getInboxEmails);

// Get starred emails
router.get('/starred', auth, emailController.getStarredEmails);

// Get newsletter emails
router.get('/newsletter', auth, emailController.getNewsletterEmails);

// Get spam emails
router.get('/spam', auth, emailController.getSpamEmails);

// Get todo emails
router.get('/todo', auth, emailController.getTodoEmails);

// Get sent emails (emails where the user is the sender)
router.get('/sent', auth, emailController.getSentEmails);

// Get draft emails
router.get('/drafts', auth, emailController.getDraftEmails);

// Get trash emails
router.get('/trash', auth, emailController.getTrashEmails);

// Get email thread
router.get('/thread/:emailId', auth, emailController.getEmailThread);

// Mock email inbox
router.get('/inbox/mock', emailController.getMockInbox);

// Get email by ID (this should be last to avoid conflicts)
router.get('/:id', auth, emailController.getEmailById);

module.exports = router;