// File: routes/students.js
// This is the complete and corrected version with all routes and proper exports.

const express = require('express');
const router = express.Router();
const Student = require('../models/student'); // Using lowercase 's' for consistency
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

// POST /api/students - Create a new student
router.post("/", protect, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/students/:id - Get a single student (for viewing or editing)
router.get("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: "Not found" });
    res.json(student);
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
        // PDF generation logic...
        doc.fontSize(20).text(`Student Record: ${student.fullName}`);
        doc.moveDown();
        doc.fontSize(12).text(`Matric Number: ${student.matric_no}`);
        doc.text(`Department: ${student.department}`);
        // Add more fields as needed...
        doc.end();
    } catch (err) {
        console.error("https://student-health-backend.onrender.com Error generating PDF:", err);
        res.status(500).send("Failed to generate PDF document.");
    }
});

// PUT /api/students/:id - Update a student
router.put("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
             if (key === 'password' && req.body.password === '') {} 
             else { student[key] = req.body[key]; }
        }
    });
    const updatedStudent = await student.save();
    res.json({ message: "Record updated successfully", student: updatedStudent });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/students/:id - Delete a student
router.delete("/:id", protect, async (req, res) => {
  try {
    const result = await Student.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/bulk-import - Bulk import students
router.post("/bulk-import", protect, async (req, res) => {
    const studentsToImport = req.body.students;
    if (!studentsToImport || !Array.isArray(studentsToImport) || studentsToImport.length === 0) {
        return res.status(400).json({ message: 'Request must include a non-empty array of students.' });
    }
    try {
        const insertedStudents = await Student.insertMany(studentsToImport, { ordered: false }); 
        res.status(201).json({
            message: `Successfully imported ${insertedStudents.length} of ${studentsToImport.length} records.`,
            successCount: insertedStudents.length,
            attemptedCount: studentsToImport.length,
        });
    } catch (error) {
        if (error.writeErrors) {
            const successfulCount = error.insertedDocs?.length || 0;
            const failedCount = error.writeErrors.length;
            const totalAttempted = successfulCount + failedCount;
            const errorSummary = error.writeErrors.map(err => `Record #${err.index}: ${err.errmsg}`).join('\n');
            return res.status(400).json({
                message: `Partial success. Imported ${successfulCount} of ${totalAttempted} records. Some records had errors.`,
                errorDetails: errorSummary
            });
        }
        res.status(500).json({ message: 'A server error occurred during the bulk import process.', error: error.message });
    }
});

module.exports = router;
