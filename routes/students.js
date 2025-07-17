// File: routes/students.js
// CORRECTED: The path to the Student model now uses a lowercase 's'.

const express = require('express');
const router = express.Router();
const Student = require('../models/students'); // <-- CORRECTED from '../models/Student'
const { protect } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');

// GET /api/students - Get all students with filtering and pagination
router.get("/", protect, async (req, res) => {
    try {
        const query = {};
        if (req.query.department) { query.department = req.query.department; }
        if (req.query.faculty) { query.faculty = req.query.faculty; }
        if (req.query.gender) { query.gender = req.query.gender; }
        if (req.query.healthStatus) { query.healthStatus = req.query.healthStatus; }
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i'); 
            query.$or = [
                { fullName: searchRegex },
                { matric_no: searchRegex },
                { medical_number: searchRegex }
            ];
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const totalRecords = await Student.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        const students = await Student.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
        res.json({ students, currentPage: page, totalPages, totalRecords });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/students/:id/download-pdf - Download a single student record as PDF
router.get("/:id/download-pdf", protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-password');
        if (!student) {
            return res.status(404).send("Student not found");
        }
        const doc = new PDFDocument({ margin: 50 });
        const filename = `record_${(student.fullName || student.matric_no).replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);
        // ... (PDF generation logic remains the same) ...
        doc.end();
    } catch (err) {
        console.error("[Backend] Error generating PDF:", err);
        res.status(500).send("Failed to generate PDF document.");
    }
});

// Other routes (POST, GET by ID, PUT, DELETE) remain the same
// ...

module.exports = router;
