// index.js (Corrected and Final Version for Deployment)

require('dotenv').config(); // This MUST be at the very top

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const listEndpoints = require('express-list-endpoints');

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's port

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// IMPORTANT: Ensure your filenames in the 'routes' folder match these exactly (lowercase).
const studentRoutes = require("./routes/students");
const authRoutes = require("./routes/authRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const statsRoutes = require('./routes/statsRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

// Use the routes with their base paths
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentAuthRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/conversations', conversationRoutes);

// Root route for basic testing
app.get("/", (req, res) => {
  res.send("Welcome to Student Health Record API");
});

// --- Database Connection and Server Start ---
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log("MongoDB Atlas Connected Successfully!");
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("CRITICAL: Could not connect to MongoDB. Server will not start.");
        console.error("Connection Error:", err);
    });
