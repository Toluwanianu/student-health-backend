// File: student-login.js
// Handles student login form submission.

document.addEventListener('DOMContentLoaded', () => {
    const studentLoginForm = document.getElementById('studentLoginForm');
    const matricNoInput = document.getElementById('matric_no');
    const passwordInput = document.getElementById('password');
    const errorMessageElement = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginBtn');

    if (!studentLoginForm) {
        console.error('Student login form not found!');
        return;
    }

    studentLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const originalButtonText = loginButton.textContent;
        errorMessageElement.textContent = '';
        loginButton.disabled = true; 
        loginButton.innerHTML = `<span class="button-spinner"></span> Signing In...`;

        const matric_no = matricNoInput.value.trim().toUpperCase(); // Send matric no in uppercase
        const password = passwordInput.value;

        if (!matric_no || !password) {
            errorMessageElement.textContent = 'Please enter both Matric Number and Password.';
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
            return;
        }

        try {
            // This is the new API endpoint for student login
            const apiUrl = 'https://student-health-backend.onrender.com/api/student/login';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matric_no, password }),
            });

            const responseData = await response.json();

            if (response.ok) {
                console.log('Student login successful, token received.');
                
                // Store the token and student's name for the student portal
                if (responseData.token && responseData.student.fullName) {
                    // Use different keys than admin to avoid conflicts
                    localStorage.setItem('studentAuthToken', responseData.token);
                    localStorage.setItem('studentName', responseData.student.fullName);
                } else {
                    throw new Error('Authentication response is missing required data.');
                }

                // After successful login
                window.location.href = 'student-dashboard.html';

            } else {
                errorMessageElement.textContent = responseData.message || 'Login failed. Please check your credentials.';
            }
        } catch (error) {
            console.error('Network error during student login:', error);
            errorMessageElement.textContent = 'An error occurred. Please try again later.';
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    });
});
