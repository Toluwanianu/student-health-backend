// File: routes/authRoutes.js
// This file handles admin login, registration, and password recovery.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const Admin = require('../models/admin'); // Using lowercase 'admin' to match your likely filename

// POST /api/auth/login - Admin Login
router.post('/login', async (req, res) => {
    console.log('[Backend] /api/auth/login route hit.'); 
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    try {
        const admin = await Admin.findOne({ username: username.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create the payload for the token, including the admin role
        const payload = {
            id: admin._id,
            username: admin.username,
            role: 'admin'
        };

        // Sign the token with your secret key from the .env file
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );
        
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            admin: { 
                id: admin._id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('Login server error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST /api/auth/register - Create a new admin account
// NOTE: This route should be commented out or removed in a production environment for security.
router.post('/register', async (req, res) => {
    console.log('[Backend] /api/auth/register route hit.');
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newAdmin = new Admin({
            username: username.toLowerCase(),
            password: password // The pre-save hook in the model will hash this
        });

        await newAdmin.save();
        
        res.status(201).json({
            message: 'Admin registered successfully!',
            admin: {
                id: newAdmin._id,
                username: newAdmin.username
            }
        });

    } catch (error) {
        console.error('Registration server error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: req.body.username.toLowerCase() });

        if (!admin) {
            console.log(`[Backend] Password reset requested for non-existent admin: ${req.body.username}`);
            return res.status(200).json({ message: 'If an account with that username exists, a password reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        admin.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        admin.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await admin.save();

        const resetURL = `http://127.0.0.1:8080/reset-password.html?token=${resetToken}&userType=admin`;

        console.log('------------------------------------');
        console.log('ADMIN PASSWORD RESET LINK (for development):');
        console.log(resetURL);
        console.log('------------------------------------');

        res.status(200).json({ message: 'If an account with that username exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const admin = await Admin.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        admin.password = req.body.password;
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;

        await admin.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
});

module.exports = router;
