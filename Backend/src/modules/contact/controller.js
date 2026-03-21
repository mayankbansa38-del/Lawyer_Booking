import { sendEmail } from '../../utils/email.js';

/**
 * Handle contact form submissions
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const submitContactForm = async (req, res) => {
    try {
        const { name, phone, email, message } = req.body;

        if (!name || !phone || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, phone, email, message) are required.',
            });
        }

        // The target email where the contact request should be sent
        const targetEmail = 'tipdot95@gmail.com';

        const emailSubject = `New Consultation Request from ${name}`;
        
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">New Legal Consultation Request</h2>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
                    <p style="margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                </div>
                <div style="margin-top: 20px;">
                    <h3 style="color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Legal Issue Description</h3>
                    <p style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; white-space: pre-wrap; line-height: 1.5;">${message}</p>
                </div>
                <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
                    This email was sent from the NyayBooker Contact Form.
                </p>
            </div>
        `;

        // Send email
        await sendEmail({
            to: targetEmail,
            subject: emailSubject,
            html: emailHtml
        });

        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully.',
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while sending your message. Please try again later.',
        });
    }
};
