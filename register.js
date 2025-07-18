// File: register.js
// Handles the admin registration form submission with corrected URL and safer JSON parsing.

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long.', 'error');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = `<span class="button-spinner"></span> Registering...`;

        try {
            // ***** 1. CORRECTED API URL *****
            // This now points to your live backend server on Render.
            const apiUrl = 'https://student-health-backend.onrender.com/api/auth/register';
            // *********************************

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirmPassword })
            });

            // ***** 2. SAFEGUARD FOR JSON PARSING *****
            // Check the content type of the response before trying to parse it as JSON.
            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                // If the response is not JSON (e.g., an HTML error page), handle it as a text error.
                const textResponse = await response.text();
                throw new Error(`Server returned a non-JSON response: ${textResponse}`);
            }
            // ****************************************

            if (response.ok) {
                showToast('Admin registered successfully! You can now log in.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html.html'; // Redirect to the main login page
                }, 2000);
            } else {
                showToast(responseData.message || 'Registration failed.', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Registration Error:', error);
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register Admin';
        }
    });
});
