import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendPasswordResetEmail(email: string, resetToken: string, firstName?: string | null) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DOMAINS?.split(',')[0] 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  const { data, error } = await client.emails.send({
    from: fromEmail || 'Chomper <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your Chomper password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin: 0;">Chomper</h1>
            <p style="color: #666; margin-top: 5px;">Your productivity companion</p>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">${greeting},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetLink}</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }

  return data;
}

export async function sendVerificationEmail(email: string, verificationToken: string, firstName?: string | null) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DOMAINS?.split(',')[0] 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const verifyLink = `${baseUrl}/verify-email?token=${verificationToken}`;
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  const { data, error } = await client.emails.send({
    from: fromEmail || 'Chomper <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your Chomper email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin: 0;">Chomper</h1>
            <p style="color: #666; margin-top: 5px;">Your productivity companion</p>
          </div>
          
          <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">${greeting}, welcome to Chomper!</h2>
            <p>Thanks for signing up! Please verify your email address to get started with your chomping journey:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verifyLink}</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }

  return data;
}
