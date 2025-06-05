import express from 'express';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve('.', '.env') });

const router = express.Router();

// Check if API key exists and initialize Resend with proper error handling
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Log for debugging (remove in production)
console.log('RESEND_API_KEY available:', !!RESEND_API_KEY);

// Initialize Resend only if API key is available
let resend;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.error('Warning: RESEND_API_KEY is not defined in environment variables');
}

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Check if Resend was properly initialized
  if (!resend) {
    console.error('Email service not configured. Check RESEND_API_KEY environment variable.');
    return res.status(500).json({ success: false, message: 'Email service not configured properly.' });
  }

  try {
    // Use environment variables with fallbacks
    const fromEmail = process.env.EMAIL_FROM;
    const toEmail = process.env.EMAIL_TO;
    
    // Log email configuration for debugging
    console.log('Sending email with configuration:', {
      from: fromEmail,
      to: toEmail,
      subject: `Contact Form: ${subject}`,
    });
    
    if (!fromEmail || !toEmail) {
      console.error('Missing email configuration:', { fromEmail, toEmail });
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration incomplete. Check EMAIL_FROM and EMAIL_TO environment variables.' 
      });
    }
    
    // Add reply-to header to enable direct replies to the sender
    const data = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: email, // Add reply-to header with the sender's email
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This message was sent from the contact form on Codyssey.
          </p>
        </div>
      `,
    });
    
    // Log the response from Resend API for debugging
    console.log('Resend API response:', data);

    if (!data || !data.id) {
      console.warn('Resend API returned success but without an email ID:', data);
    }

    res.status(200).json({ success: true, message: 'Message sent successfully!', data });
  } catch (err) {
    console.error('Contact form email failed. Error details:', err);
    
    // Check if there's API error data
    const errorDetails = err.response?.data || {};
    console.error('API error details:', errorDetails);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
