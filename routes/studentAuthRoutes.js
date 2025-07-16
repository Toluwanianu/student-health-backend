// File: routes/studentAuthRoutes.js
// Handles student login, fetching their own data, and password reset.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node.js module for generating tokens
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');

// POST /api/student/login - Student Login
router.post('/login', async (req, res) => {
    console.log('[Backend] Student login attempt with:', req.body);
    const { matric_no, password } = req.body;

    if (!matric_no || !password) {
        return res.status(400).json({ message: 'Please provide Matric Number and Password.' });
    }

    try {
        // Find student by matriculation number (case-insensitive is a good practice if format varies)
        const student = await Student.findOne({ matric_no: { $regex: new RegExp(`^${matric_no}$`, 'i') } }); 

        if (!student) {
            return res.status(401).json({ message: 'Invalid Matric Number or Password.' });
        }

        const isMatch = await student.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Matric Number or Password.' });
        }

        const payload = {
            id: student._id,
            matric_no: student.matric_no,
            fullName: student.fullName,
            role: 'student' // Add a role to distinguish from admins
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful!',
            token: token,
            student: { 
                id: student._id,
                fullName: student.fullName
            }
        });

    } catch (error) {
        console.error('[Backend] Student login server error:', error);
        res.status(500).json({ message: 'Server error during student login.' });
    }
});


// GET /api/student/my-record - Get the logged-in student's own record
router.get('/my-record', protect, async (req, res) => {
    console.log(`[Backend] Request received for /api/student/my-record. User ID from token: ${req.user.id}`);
    try {
        // The 'protect' middleware gives us the user's ID in req.user.id
        // .select('-password') ensures we never send the hashed password to the frontend
        const student = await Student.findById(req.user.id).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student record not found.' });
        }

        res.status(200).json(student);

    } catch (error) {
        console.error('[Backend] Error fetching student self-record:', error);
        res.status(500).json({ message: 'Server error while fetching your record.' });
    }
});


// --- NEW: FORGOT PASSWORD FUNCTIONALITY ---

// POST /api/student/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        // For students, we'll find them by their email address.
        const student = await Student.findOne({ email: req.body.email.toLowerCase() });

        if (!student) {
            // To prevent attackers from checking which emails are registered,
            // we send a success message even if the email is not found.
            console.log(`[Backend] Password reset requested for non-existent student email: ${req.body.email}`);
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // 1. Generate a random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 2. Hash the token and set it on the student model
        student.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        // 3. Set an expiration time (e.g., 10 minutes from now)
        student.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        await student.save();

        // 4. Create the reset URL
        const resetURL = `http://127.0.0.1:8080/reset-password.html?token=${resetToken}&userType=student`;

        // 5. For this project, we will LOG the link to the console instead of sending an email.
        console.log('------------------------------------');
        console.log('STUDENT PASSWORD RESET LINK (for development):');
        console.log(resetURL);
        console.log('------------------------------------');

        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error (student):', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});


// POST /api/student/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    try {
        // 1. Hash the incoming token so we can find it in the database
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // 2. Find the student by the hashed token and check if the token has not expired
        const student = await Student.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() } // $gt means "greater than"
        });

        if (!student) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // 3. Set the new password
        student.password = req.body.password;
        // Clear the reset token fields
        student.passwordResetToken = undefined;
        student.passwordResetExpires = undefined;

        // The pre-save hook will automatically hash the new password
        await student.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset password error (student):', error);
        res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
});


module.exports = router;
