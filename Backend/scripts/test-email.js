/**
 * Test Nodemailer Configuration
 * Run: node scripts/test-email.js
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function testEmail() {
    console.log('🧪 Testing Nodemailer Configuration...\n');
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    console.log('📧 SMTP Port:', process.env.SMTP_PORT);
    console.log('📧 SMTP User:', process.env.SMTP_USER);
    console.log('📧 Email From:', process.env.EMAIL_FROM);
    console.log('');

    try {
        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!\n');

        // Send test email
        const testEmail = process.env.SMTP_USER; // Send to self

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `NyayBooker <${process.env.SMTP_USER}>`,
            to: testEmail,
            subject: '🔐 NyayBooker - Email Verification Test',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1e40af; margin: 0;">NyayBooker</h1>
                        <p style="color: #6b7280; margin: 5px 0;">Elite Legal Appointments</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 30px; border-radius: 16px; text-align: center; color: white;">
                        <h2 style="margin: 0 0 10px 0;">✅ Email Test Successful!</h2>
                        <p style="margin: 0; opacity: 0.9;">Your SMTP configuration is working correctly.</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 12px;">
                        <p style="margin: 0; color: #374151;">
                            <strong>Test Details:</strong><br>
                            Sent at: ${new Date().toISOString()}<br>
                            From: ${process.env.EMAIL_FROM}<br>
                            To: ${testEmail}
                        </p>
                    </div>
                    
                    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
                        © ${new Date().getFullYear()} NyayBooker. All rights reserved.
                    </p>
                </div>
            `,
        });

        console.log('✅ Test email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📮 Sent to:', testEmail);
        console.log('\n🎉 Nodemailer is configured correctly!');

    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check SMTP_USER and SMTP_PASS in .env');
        console.error('2. For Gmail, use an App Password (not your regular password)');
        console.error('3. Enable "Less secure apps" or use OAuth2');
        process.exit(1);
    }
}

testEmail();
