// File: register.js
// Handles the admin registration form submission.

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
            const apiUrl = 'https://student-health-backend.onrender.com/api/auth/register';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, confirmPassword })
            });

            const responseData = await response.json();

            if (response.ok) {
                showToast('Admin registered successfully! You can now log in.', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
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
