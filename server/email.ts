import nodemailer from 'nodemailer';

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

export async function sendOTPEmail(email: string, otp: string, type: 'registration' | 'password_reset') {
  const subject = type === 'registration' 
    ? 'NutriCare++ - Verify Your Account' 
    : 'NutriCare++ - Reset Your Password';
    
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #10B981, #34D399); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 32px;">🌱</span>
        </div>
        <h1 style="color: #10B981; margin: 0;">NutriCare++</h1>
      </div>
      
      <div style="background: #f8fffe; border: 1px solid #d1fae5; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #065f46; margin-bottom: 20px;">
          ${type === 'registration' ? 'Verify Your Account' : 'Reset Your Password'}
        </h2>
        
        <p style="color: #374151; margin-bottom: 30px; line-height: 1.6;">
          ${type === 'registration' 
            ? 'Welcome to NutriCare++! Please use the verification code below to complete your registration:'
            : 'You requested to reset your password. Use the code below to set a new password:'
          }
        </p>
        
        <div style="background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; color: #10B981; letter-spacing: 8px;">${otp}</span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This code will expire in 5 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2024 NutriCare++. Empowering healthy lifestyles worldwide.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NutriCare++" <${process.env.EMAIL_USER || 'noreply@nutricare.com'}>`,
      to: email,
      subject,
      html,
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send verification email');
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}