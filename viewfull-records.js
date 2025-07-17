// File: viewfull-records.js
// Displays the full details for a single student record.
// UPDATED: Now sends the JWT Authorization header and uses the correct, full API URL.

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH GUARD (Admin version) ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn("Auth Guard: No admin token found. Redirecting to login.");
        window.location.href = 'login.html.html'; // Redirect to login if no token
        return;
    }

    // --- Element References ---
    const recordContainer = document.getElementById('record-container');
    const studentNameTitle = document.getElementById('studentNameTitle');

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- Fetch and Display the Full Student Record ---
    async function fetchFullRecord() {
        // Get the student's ID from the URL parameter.
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id');

        if (!studentId) {
            if (recordContainer) recordContainer.innerHTML = `<p class="text-red-500">Error: No student ID was provided in the URL.</p>`;
            console.error("No student ID found in URL parameters.");
            return;
        }

        if (recordContainer) recordContainer.innerHTML = `<p class="text-center p-8 text-gray-500">Loading full record...</p>`;

        try {
            // ***** THIS IS THE CORRECTED URL *****
            const apiUrl = `https://student-health-backend.onrender.com/api/students/${studentId}`;
            // ************************************
            
            console.log(`[ViewFullRecordJS] Fetching from: ${apiUrl}`);
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders() 
            });

            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'login.html.html';
                return;
            }
            if (!response.ok) {
                throw new Error(`Failed to fetch record. Server responded with status ${response.status}`);
            }

            const student = await response.json();

            // Populate the page with the student's data
            if (studentNameTitle) {
                studentNameTitle.textContent = `Full Record for ${student.fullName || 'N/A'}`;
            }

            if (recordContainer) {
                let detailsHtml = '<div class="details-grid">'; // Using a grid for better layout
                for (const key in student) {
                    // Skip internal fields like _id, __v, and password
                    if (Object.prototype.hasOwnProperty.call(student, key) && !key.startsWith('_') && key !== 'password' && key !== 'createdAt' && key !== 'updatedAt') {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        let value = student[key];
                        // Format date nicely
                        if (key === 'date_of_birth' && value) {
                            value = new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                        }
                        detailsHtml += `
                            <div class="detail-item">
                                <span class="detail-label">${formattedKey}:</span>
                                <span class="detail-value">${value || 'N/A'}</span>
                            </div>
                        `;
                    }
                }
                detailsHtml += '</div>';
                recordContainer.innerHTML = detailsHtml;
            }

        } catch (error) {
            console.error('Error fetching full student record:', error);
            if (recordContainer) recordContainer.innerHTML = `<p class="text-red-500 text-center p-8">Error loading record: ${error.message}</p>`;
        }
    }

    // Initial call to fetch the data when the page loads
    fetchFullRecord();
});
