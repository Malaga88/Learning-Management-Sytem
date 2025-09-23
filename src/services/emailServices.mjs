import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, html, text = null) {
        try {
            const mailOptions = {
                from: `"${process.env.APP_NAME || 'LMS Platform'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendVerificationEmail(user, verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to ${process.env.APP_NAME || 'LMS Platform'}!</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for joining our learning platform! To get started, please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This verification link will expire in 24 hours for security reasons.
                </p>
            </div>
            
            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;

        return this.sendEmail(user.email, 'Verify your email address', html);
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: #e74c3c; padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #e74c3c; word-break: break-all;">${resetUrl}</a>
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This reset link will expire in 1 hour for security reasons.
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>Security Tip:</strong> Never share this link with anyone. Our team will never ask for your password.
                    </p>
                </div>
            </div>
            
            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;

        return this.sendEmail(user.email, 'Reset your password', html);
    }

    async sendWelcomeEmail(user) {
        const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
        
        const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to the Platform!</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Your email has been verified successfully! You're now ready to start your learning journey.
                </p>
                
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
                    <ul style="color: #666; padding-left: 20px;">
                        <li>Browse our course catalog</li>
                        <li>Enroll in courses that interest you</li>
                        <li>Track your learning progress</li>
                        <li>Take quizzes and earn certificates</li>
                        ${user.role === 'instructor' ? '<li>Create and manage your own courses</li>' : ''}
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${dashboardUrl}" 
                       style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
            </div>
            
            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;

        return this.sendEmail(user.email, 'Welcome! Your email is verified', html);
    }

    async sendCourseEnrollmentEmail(user, course) {
        const courseUrl = `${process.env.FRONTEND_URL}/courses/${course._id}`;
        
        const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">📚 Enrollment Confirmed!</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Congratulations! You've successfully enrolled in <strong>${course.title}</strong>.
                </p>
                
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef;">
                    <h3 style="color: #333; margin-top: 0;">Course Details:</h3>
                    <p style="color: #666; margin: 5px 0;"><strong>Title:</strong> ${course.title}</p>
                    <p style="color: #666; margin: 5px 0;"><strong>Level:</strong> ${course.level}</p>
                    ${course.duration ? `<p style="color: #666; margin: 5px 0;"><strong>Duration:</strong> ${course.duration} hours</p>` : ''}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${courseUrl}" 
                       style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Start Learning Now
                    </a>
                </div>
            </div>
            
            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;

        return this.sendEmail(user.email, `Enrolled in ${course.title}`, html);
    }

    // Course completion certificate email
    async sendCertificateEmail(user, course, certificateUrl) {
        const html = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #f39c12 0%, #d35400 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🏆 Congratulations!</h1>
            </div>
            
            <div style="padding: 40px 20px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Amazing work! You've successfully completed <strong>${course.title}</strong> and earned your certificate.
                </p>
                
                <div style="background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #856404; margin-top: 0;">🎓 Certificate Earned!</h3>
                    <p style="color: #856404; margin: 10px 0;">Course: ${course.title}</p>
                    <p style="color: #856404; margin: 10px 0;">Completed: ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${certificateUrl}" 
                       style="background: #f39c12; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Download Certificate
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center;">
                    Share your achievement on social media and showcase your new skills!
                </p>
            </div>
            
            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'LMS Platform'}. All rights reserved.</p>
            </div>
        </div>`;

        return this.sendEmail(user.email, `🏆 Certificate for ${course.title}`, html);
    }
}

export default new EmailService();