// File: middleware/authMiddleware.js
// This middleware will protect our API routes.

const jwt = require('jsonwebtoken');
const Admin = require('../models/admin'); // To potentially check admin details later
const Student = require('../models/student'); // To potentially check student details later

const protect = async (req, res, next) => {
    let token;

    // The token is usually sent in the headers in the format "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user's info to the request object (excluding password)
            // This is useful for other routes if they need to know who is making the request.
            // For example, req.user.id will be the ID of the logged-in admin or student.
            req.user = decoded; 

            // Move on to the next step (the actual route handler)
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
