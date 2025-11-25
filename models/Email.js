const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  sender: {
    name: String,
    email: String
  },
  recipients: [{
    name: String,
    email: String
  }],
  subject: String,
  body: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Important', 'Newsletter', 'Spam', 'To-Do']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent']
  },
  actionItems: [{
    action_required: String,
    requested_time: String,
    from: String,
    confirmation_needed: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  draftReply: {
    subject: String,
    body: String,
    timestamp: Date
  },
  read: {
    type: Boolean,
    default: false
  },
  labels: [String],
  isDraft: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  },
  archived: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  starred: {
    type: Boolean,
    default: false
  },
  // Track which users have moved this email to trash
  trashedBy: [{
    type: String  // User email
  }],
  // Track which users have permanently deleted this email
  permanentlyDeletedBy: [{
    type: String  // User email
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Email', emailSchema);