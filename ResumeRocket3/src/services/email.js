const { Resend } = require('resend');

const resend = new Resend('re_NNznr6D3_4Vqz24kz5VJgxCx2pEnrHz8u');

// Email templates
const generateUploadNotificationEmail = (filename, userEmail, uploadDetails) => {
  return {
    from: 'Resume Platform <noreply@resumeplatform.com>',
    to: ['uploads@resumeplatform.com'], // Collection email
    cc: [userEmail], // Copy the user
    subject: `New Resume Upload: ${filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Resume Upload Notification</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Upload Details:</h3>
          <p><strong>Filename:</strong> ${filename}</p>
          <p><strong>User Email:</strong> ${userEmail}</p>
          <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>File Size:</strong> ${uploadDetails.size ? Math.round(uploadDetails.size / 1024) + ' KB' : 'Unknown'}</p>
          <p><strong>Industry:</strong> ${uploadDetails.industry || 'Not specified'}</p>
        </div>
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px;">
          <h4>Analysis Summary:</h4>
          <p><strong>ATS Score:</strong> ${uploadDetails.atsScore || 'Pending analysis'}</p>
          <p><strong>Status:</strong> Ready for processing</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This is an automated notification from the Resume Platform upload system.
        </p>
      </div>
    `
  };
};

const generateWelcomeEmail = (user) => {
  return {
    from: 'Resume Platform <welcome@resumeplatform.com>',
    to: [user.email],
    subject: 'Welcome to Resume Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Resume Platform, ${user.firstName}!</h2>
        <p>Thank you for joining our resume optimization platform. We're excited to help you create outstanding resumes that get noticed.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Getting Started:</h3>
          <ul>
            <li>Upload your resume for instant ATS scoring</li>
            <li>Get personalized optimization suggestions</li>
            <li>Track your progress with detailed analytics</li>
            <li>Access industry-specific recommendations</li>
          </ul>
        </div>
        
        <p>If you have any questions, our support team is here to help.</p>
        <p>Best regards,<br>The Resume Platform Team</p>
      </div>
    `
  };
};

const generateAnalysisCompleteEmail = (user, resume, analysis) => {
  return {
    from: 'Resume Platform <notifications@resumeplatform.com>',
    to: [user.email],
    bcc: ['uploads@resumeplatform.com'], // Also send to collection email
    subject: `Resume Analysis Complete - ATS Score: ${analysis.atsScore}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Resume Analysis is Ready!</h2>
        <p>Hi ${user.firstName},</p>
        <p>We've completed the analysis of your resume: <strong>${resume.filename}</strong></p>
        
        <div style="background: ${analysis.atsScore >= 80 ? '#d4edda' : analysis.atsScore >= 60 ? '#fff3cd' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>ATS Score: ${analysis.atsScore}/100</h3>
          <p><strong>Industry:</strong> ${resume.industry}</p>
          <p><strong>Status:</strong> ${analysis.atsScore >= 80 ? 'Excellent' : analysis.atsScore >= 60 ? 'Good - Room for improvement' : 'Needs optimization'}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h4>Key Insights:</h4>
          <p><strong>Strengths:</strong> ${analysis.strengths?.length || 0} identified</p>
          <p><strong>Improvement Areas:</strong> ${analysis.suggestions?.length || 0} recommendations</p>
        </div>
        
        <p>Log in to your dashboard to view the complete analysis and optimization suggestions.</p>
        <p>Best regards,<br>The Resume Platform Team</p>
      </div>
    `
  };
};

// Email sending functions
async function sendUploadNotification(filename, userEmail, uploadDetails) {
  try {
    const emailData = generateUploadNotificationEmail(filename, userEmail, uploadDetails);
    const result = await resend.emails.send(emailData);
    console.log('Upload notification sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send upload notification:', error);
    throw error;
  }
}

async function sendWelcomeEmail(user) {
  try {
    const emailData = generateWelcomeEmail(user);
    const result = await resend.emails.send(emailData);
    console.log('Welcome email sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

async function sendAnalysisCompleteEmail(user, resume, analysis) {
  try {
    const emailData = generateAnalysisCompleteEmail(user, resume, analysis);
    const result = await resend.emails.send(emailData);
    console.log('Analysis complete email sent:', result.id);
    return result;
  } catch (error) {
    console.error('Failed to send analysis complete email:', error);
    throw error;
  }
}

module.exports = {
  sendUploadNotification,
  sendWelcomeEmail,
  sendAnalysisCompleteEmail
};