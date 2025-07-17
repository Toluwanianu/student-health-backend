// add-record.js (Corrected and updated to use toast notifications)

document.addEventListener('DOMContentLoaded', () => {
    // Ensure the notifications.js script is loaded and the showToast function is available
    if (typeof showToast !== 'function') {
        console.error('Notification system (showToast) is not available. Make sure notifications.js is loaded before this script.');
        // As a fallback, we can redefine alert to be showToast so the app doesn't crash
        window.showToast = (message, type) => alert(`[${type.toUpperCase()}] ${message}`);
    }

    const addStudentForm = document.getElementById('addStudentForm');
    const submitButton = addStudentForm ? addStudentForm.querySelector('button[type="submit"]') : null;
    const originalButtonText = submitButton ? submitButton.textContent : 'Add Record';

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken'); // This is the admin's token
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // --- Password validation ---
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');

            if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
                showToast('Passwords do not match. Please re-enter them.', 'error'); // Use toast for error
                passwordInput.focus();
                return; 
            }
            
            if(submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = `<span class="button-spinner"></span> Adding...`;
            }

            const formData = new FormData(addStudentForm);
            const studentData = {};

            for (const [key, value] of formData.entries()) {
                if (key === 'confirmPassword') continue; 

                if (key === "age" || key === "level" || key === "hostelClinicVisits") {
                    studentData[key] = value ? parseInt(value, 10) : null;
                } else if (key === "date_of_birth" && !value) {
                    studentData[key] = null;
                } else {
                    studentData[key] = value.trim() === '' ? null : value.trim();
                }
            }
            
            try {
                const apiUrl = 'https://student-health-backend.onrender.com'; 

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: getAuthHeaders(), // Use the helper function here
                    body: JSON.stringify(studentData),
                });

                const responseData = await response.json();

                if (response.ok) { 
                    showToast(`Record for ${studentData.fullName} added successfully!`, 'success');
                    addStudentForm.reset(); 
                } else {
                    showToast(`Failed to add record: ${responseData.message || `Server error ${response.status}`}`, 'error');
                }
            } catch (error) {
                console.error('Network or other error:', error);
                showToast(`An error occurred: ${error.message}`, 'error');
            } finally {
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    } else {
        console.error('Add Student Form with ID "addStudentForm" not found!');
    }
});