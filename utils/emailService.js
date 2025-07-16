// File: utils/emailService.js
// UPDATED with a fix for the 'self-signed certificate' error.

const nodemailer = require('nodemailer');

const sendNewMessageAlert = async (studentName, subject) => {
    console.log("[Email Service] Function 'sendNewMessageAlert' has been called.");

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const adminEmail = process.env.ADMIN_EMAIL;

    console.log(`[Email Service] EMAIL_USER loaded as: ${emailUser}`);
    console.log(`[Email Service] EMAIL_PASS loaded as: ${emailPass ? '******** (loaded)' : 'NOT LOADED'}`);
    console.log(`[Email Service] ADMIN_EMAIL loaded as: ${adminEmail}`);

    if (!adminEmail || !emailUser || !emailPass) {
        console.error('[Email Service] One or more email credentials are not configured in .env.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        // ***** THIS IS THE FIX for the 'self-signed certificate' error *****
        // This tells Node.js to allow connections even if there's a self-signed certificate in the chain.
        // This is generally safe for development but you might remove it for a production server.
        tls: {
            rejectUnauthorized: false
        }
        // *******************************************************************
    });

    const mailOptions = {
        from: `"Student Health Portal" <${emailUser}>`,
        to: adminEmail,
        subject: `New Health Message from ${studentName}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>New Message Received</h2>
                <p>A new message has been submitted by student <strong>${studentName}</strong> regarding the conversation:</p>
                <h3>"${subject}"</h3>
                <p>Please log in to the admin dashboard to view the message and reply.</p>
                <hr>
                <p style="font-size: 0.8em; color: #777;">This is an automated notification from the Student Health Record System.</p>
            </div>
        `,
    };

    try {
        console.log(`[Email Service] Attempting to send email to ${adminEmail}...`);
        let info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] SUCCESS! Notification email sent. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('[Email Service] CRITICAL: Error sending notification email:', error);
    }
};

module.exports = { sendNewMessageAlert };
