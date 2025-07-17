// edit-record.js (Consolidated and Updated)
// This version consolidates the initial loading of student data and the form submission logic into a more streamlined process.
// It also ensures that the password fields are handled securely and that the UI provides proper feedback during operations.

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editForm');
    const studentIdFromStorage = localStorage.getItem("editId"); 

    // Get reference to the submit button to manage its state
    const submitButton = editForm ? editForm.querySelector('button[type="submit"]') : null;
    const originalButtonText = submitButton ? submitButton.textContent : 'Update Record';

    if (!editForm) {
        console.error("CRITICAL: Edit form not found!");
        alert("Page Error: The form is missing and cannot be loaded.");
        return;
    }

    if (!studentIdFromStorage) {
        alert("No record ID found to edit. Redirecting to records list.");
        window.location.href = "view-records.html";
        return;
    }

    // --- Get references to ALL form input fields ---
    const studentIdInput = document.getElementById("studentId");
    const fullNameInput = document.getElementById("fullName");
    const matricNoInput = document.getElementById("matric_no");
    const passwordInput = document.getElementById('password'); // New password field
    const confirmPasswordInput = document.getElementById('confirmPassword'); // New confirm password field
    // ... all other getElementById calls for your form fields ...
    const medicalNoInput = document.getElementById("medical_number");
    const departmentInput = document.getElementById("department");
    const facultyInput = document.getElementById("faculty");
    const ageInput = document.getElementById("age");
    const genderInput = document.getElementById("gender");
    const genotypeInput = document.getElementById("genotype");
    const allergiesInput = document.getElementById("allergies");
    const currentComplaintInput = document.getElementById("current_complaint");
    const drugsGivenInput = document.getElementById("drugsGiven");
    const healthStatusInput = document.getElementById("healthStatus");
    const dateOfBirthInput = document.getElementById("date_of_birth");
    const levelInput = document.getElementById("level");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const addressInput = document.getElementById("address");
    const medicalHistoryInput = document.getElementById("medicalHistory");
    const healthComplaintsInput = document.getElementById("healthComplaints");
    const hostelClinicVisitsInput = document.getElementById("hostelClinicVisits");
    const recentTreatmentsInput = document.getElementById("recentTreatments");

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        // Use 'authToken' for admin scripts, 'studentAuthToken' for student scripts
        const token = localStorage.getItem('authToken') || localStorage.getItem('studentAuthToken');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async function loadStudentData() {
        console.log('[DEBUG EditPage] Loading data for ID:', studentIdFromStorage);
        try {
            const getApiUrl = `https://student-health-backend.onrender.com/api/students/${studentIdFromStorage}`;
            const response = await fetch(getApiUrl, { headers: getAuthHeaders() });

            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login.html.html';
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch student data.");
            
            const student = await response.json();
            console.log('[DEBUG EditPage] Data received:', student);
            
            // Populate all fields EXCEPT the password fields
            // The password fields should always start blank on the edit form for security.
            fullNameInput.value = student.fullName || '';
            matricNoInput.value = student.matric_no || '';
            medicalNoInput.value = student.medical_number || '';
            departmentInput.value = student.department || '';
            facultyInput.value = student.faculty || '';
            ageInput.value = student.age || '';
            genderInput.value = student.gender || '';
            genotypeInput.value = student.genotype || '';
            allergiesInput.value = student.allergies || '';
            currentComplaintInput.value = student.current_complaint || '';
            drugsGivenInput.value = student.drugs_given || '';
            healthStatusInput.value = student.healthStatus || '';
            if (student.date_of_birth) {
                dateOfBirthInput.value = new Date(student.date_of_birth).toISOString().split('T')[0];
            }
            levelInput.value = student.level || '';
            phoneInput.value = student.phone || '';
            emailInput.value = student.email || '';
            addressInput.value = student.address || '';
            medicalHistoryInput.value = student.medicalHistory || '';
            healthComplaintsInput.value = student.healthComplaints || '';
            hostelClinicVisitsInput.value = student.hostelClinicVisits || '';
            recentTreatmentsInput.value = student.recentTreatments || '';

        } catch (error) {
            console.error("[DEBUG EditPage] Error loading student data:", error);
            alert(`An unexpected error occurred while loading data. You may be redirected.`);
            window.location.href = 'view-records.html'; // Go back if data can't be loaded
        }
    }

    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        // --- Password validation ---
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Passwords do not match. Please re-enter them.');
            passwordInput.focus();
            return; // Stop the submission
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="button-spinner"></span> Updating...`;
        }

        // Use FormData to easily get all values
        const formData = new FormData(editForm);
        const updatedData = {};
        for (const [key, value] of formData.entries()) {
            updatedData[key] = value.trim();
        }

        // IMPORTANT: Only include the password if the admin actually typed a new one.
        // If the password field is empty, we remove it from the data we send.
        // This prevents accidentally wiping out a student's existing password.
        if (!updatedData.password) {
            delete updatedData.password;
        }

        // We never send the confirmation password to the backend
        delete updatedData.confirmPassword;

        console.log('[DEBUG EditPage] Data being sent for update:', updatedData);

        try {
            const updateApiUrl = `https://student-health-backend.onrender.com/api/students/${studentIdFromStorage}`;
            const response = await fetch(updateApiUrl, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData)
            });

            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login..html.html';
                return;
            }

            const responseData = await response.json(); 

            if (response.ok) {
                alert("Record updated successfully!");
                localStorage.removeItem("editId"); 
                window.location.href = "view-records.html"; 
            } else {
                alert(`Failed to update record: ${responseData.message || 'An unknown error occurred.'}`);
            }
        } catch (error) {
            console.error("[DEBUG EditPage] Error submitting update:", error);
            alert(`An unexpected error occurred while updating.`);
        } finally {
            if(submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
    
    // Load student data into the form when the page is ready
    loadStudentData(); 
});
