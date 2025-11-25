const User = require('../models/User');
const Email = require('../models/Email');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS ? 
  nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }) : null;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '7d'
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration request received:', { name, email });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    console.log('Creating user:', { name, email });
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    console.log('Generating token for user:', user._id);
    const token = generateToken(user._id);

    // Send token in cookie
    res.cookie('token', token, {
  httpOnly: true,
  secure: true,        // you're using HTTPS on Render
  sameSite: 'none',    // REQUIRED for cross-site (Vercel -> Render)
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request received:', { email });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Checking password for user:', email);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    console.log('Generating token for user:', user._id);
    const token = generateToken(user._id);

    // Send token in cookie
   res.cookie('token', token, {
  httpOnly: true,
  secure: true,        // you're using HTTPS on Render
  sameSite: 'none',    // REQUIRED for cross-site (Vercel -> Render)
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
  httpOnly: true,
  secure: true,
  sameSite: 'none'
});
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// Logout from all devices
exports.logoutAll = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
  httpOnly: true,
  secure: true,
  sameSite: 'none'
});
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Server error during logout from all devices' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }
    
    // Update name if provided
    if (name) {
      user.name = name;
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is provided
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }
    
    // Check if new password is provided
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    // Check if confirm password is provided and matches new password
    if (!confirmPassword) {
      return res.status(400).json({ message: 'Please confirm your new password' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }
    
    // Validate current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Update password using the setter method to ensure it gets hashed
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};

// Send email between users
exports.sendEmail = async (req, res) => {
  try {
    const { senderId, recipientEmail, subject, body } = req.body;

    // Find sender
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Find recipient
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create email record in database
    const emailRecord = new Email({
      sender: {
        name: sender.name,
        email: sender.email
      },
      recipients: [{
        name: recipient.name,
        email: recipient.email
      }],
      subject: subject,
      body: body,
      timestamp: new Date(),
      read: false
    });

    // Save email to database
    const savedEmail = await emailRecord.save();

    // Send email or simulate if transporter is not configured
    if (transporter) {
      const mailOptions = {
        from: sender.email,
        to: recipient.email,
        subject: subject,
        text: body
      };

      await transporter.sendMail(mailOptions);
    } else {
      // Simulate email sending
      console.log(`Simulated email from ${sender.email} to ${recipient.email}: ${subject}`);
    }

    res.json({ 
      message: 'Email sent successfully',
      email: savedEmail
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ message: 'Server error while sending email' });
  }
};
