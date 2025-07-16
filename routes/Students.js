// File: routes/students.js
// All routes in this file are protected and require a valid token.
// UPDATED: The PUT route is corrected to properly save and hash passwords.

const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');

// GET /api/students - Get all students with filtering and pagination
router.get("/", protect, async (req, res) => {
    try {
        const query = {};
        if (req.query.department) { query.department = req.query.department; }
        if (req.query.faculty) { query.faculty = req.query.faculty; }
        if (req.query.gender) { query.gender = req.query.gender; }
        if (req.query.healthStatus) { query.healthStatus = req.query.healthStatus; }
        if (req.query.search) {
            const searchTerm = req.query.search;
            const searchRegex = new RegExp(searchTerm, 'i'); 
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
        console.error("[Backend] Error fetching students:", err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/students - Create a new student
router.post("/", protect, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save(); // The pre-save hook will hash the password here
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/students/:id - Get a single student
router.get("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: "Not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ***** UPDATED ROUTE FOR UPDATING A STUDENT *****
// This new logic ensures the password hashing function is triggered.
router.put("/:id", protect, async (req, res) => {
  console.log(`[Backend] Attempting to update student ${req.params.id}`);
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Manually update the fields from the request body
    Object.keys(req.body).forEach(key => {
        // Only update if the field is not null or undefined
        // And only update password if a new one was provided
        if (req.body[key] !== null && req.body[key] !== undefined) {
             if (key === 'password' && req.body.password === '') {
                 // Do nothing if password field is empty
             } else {
                student[key] = req.body[key];
             }
        }
    });

    // The 'pre-save' hook in models/Student.js will now run because we are calling .save()
    // It will check if 'student.password' was modified and hash it if so.
    const updatedStudent = await student.save();

    res.json({ message: "Record updated successfully", student: updatedStudent });

  } catch (err) {
    console.error("[Backend] Error updating student:", err);
    res.status(400).json({ message: err.message });
  }
});
// **************************************************

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
    // ... (bulk import logic remains the same) ...
});


module.exports = router;
