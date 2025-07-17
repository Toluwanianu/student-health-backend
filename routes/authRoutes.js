// File: routes/authRoutes.js
// Temporarily enabling the /register route to create the initial admin user.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const Admin = require('../models/admin'); 

// POST /api/auth/login - Admin Login
router.post('/login', async (req, res) => {
    // ... (login logic remains the same) ...
});


// ***** THIS ROUTE IS NOW ENABLED *****
// POST /api/auth/register - Create a new admin account
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
// ************************************


module.exports = router;
// POST /api/auth/forgot-password - Admin forgot password
router.post('/forgot-password', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const admin = await Admin.findOne({ username: username.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate a reset token and send it via email (not implemented here)
        // For now, just return a success message
        res.status(200).json({ message: 'If an account exists with that username, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password server error:', error);
        res.status(500).json({ message: 'Server error during forgot password.' });
    }
});
// POST /api/auth/reset-password/:token - Admin reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    try {
        // Verify the token (not implemented here)
        // For now, just return a success message
        res.status(200).json({ message: 'Password reset successfully!' });

    } catch (error) {
        console.error('Reset password server error:', error);
        res.status(500).json({ message: 'Server error during reset password.' });
    }
}
);
// GET /api/auth/logout - Admin Logout
router.get('/logout', (req, res) => {
    // Clear the token from the client side (handled in frontend)
    res.status(200).json({ message: 'Logged out successfully' });
});
// Middleware to protect routes
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.admin = decoded; // Attach admin info to request
        next();
    });
}
// Export the router
module.exports = {
    router,
    authenticate
};
// Note: The above code is a simplified version of the authentication routes for an admin user.
// In a production application, you would also implement proper error handling, logging, and security measures