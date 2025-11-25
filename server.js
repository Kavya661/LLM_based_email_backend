const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import routes
const emailRoutes = require('./routes/emailRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
const allowedOrigins = [
  'https://llm-based-email-frontend.vercel.app',
  'https://llm-based-email-frontend-git-main-kavyas-projects-30bd8e93.vercel.app',
  'https://llm-based-email-frontend-oom4jmubh-kavyas-projects-30bd8e93.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

// Add logging for debugging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log(`Request headers:`, req.headers);
  console.log(`Cookies:`, req.cookies);
  next();
});

// Debug middleware to check if auth is being applied globally
app.use('/api/debug', (req, res) => {
  res.json({ message: 'Debug endpoint reached', cookies: req.cookies });
});

// Routes
console.log('Registering routes...');
app.use('/api/emails', emailRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
console.log('Routes registered.');

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({ message: 'Debug endpoint reached', cookies: req.cookies });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Email Productivity Agent API is running!' });
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  // Even if MongoDB connection fails, start the server for basic functionality
  console.log('Starting server without MongoDB connection...');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (without MongoDB)`);
  });
});

module.exports = app;
