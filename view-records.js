// view-records.js (Corrected for server-side filtering and pagination)
document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const recordsBody = document.getElementById('records-body');
    const searchInput = document.getElementById('searchInput');
    const departmentFilter = document.getElementById('departmentFilter');
    const facultyFilter = document.getElementById('facultyFilter');
    const genderFilter = document.getElementById('genderFilter');
    const statusFilter = document.getElementById('statusFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const paginationInfo = document.getElementById('pagination-info');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    
    // --- State Management ---
    let currentPage = 1;
    let totalPages = 1;

    if (!recordsBody) {
        console.error('CRITICAL ERROR: Element with ID "records-body" was NOT FOUND.');
        return;
    }

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }
        return headers;
    }

    // --- Filter Population ---
    function populateSelectWithOptions(selectElement, optionsSet) {
        if (!selectElement) return;
        const currentValue = selectElement.value;
        while (selectElement.options.length > 1) { selectElement.remove(1); }
        [...optionsSet].sort().forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
        selectElement.value = currentValue;
    }

    // --- Display and Filtering Logic ---
    function displayStudentRecords(studentsToDisplay) {
        recordsBody.innerHTML = ''; 
        if (!studentsToDisplay || studentsToDisplay.length === 0) {
            const message = 'No records match your search criteria.';
            recordsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">${message}</td></tr>`;
            return;
        }
        studentsToDisplay.forEach((student) => {
            const studentId = student._id || student.id;
            if (!studentId) return; 
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.matric_no || 'N/A'}</td>
                <td>${student.fullName || 'N/A'}</td>
                <td>${student.department || 'N/A'}</td>
                <td>${student.faculty || 'N/A'}</td>
                <td>${student.gender || 'N/A'}</td>
                <td>${student.healthStatus || 'N/A'}</td>
                <td class="actions-cell"> 
                    <a href="viewfull-records.html?id=${studentId}" class="edit-btn" title="View Full Record">View</a>
                    <button class="edit-btn" data-id="${studentId}" title="Edit Record">Edit</button>
                    <button class="delete-btn" data-id="${studentId}" title="Delete Record">Delete</button>
                    <button class="download-btn" data-id="${studentId}" title="Download Record">Download</button>
                </td>
            `;
            recordsBody.appendChild(row);
        });
    }

    function renderPaginationControls() {
        if (!paginationInfo || !prevPageBtn || !nextPageBtn) return;
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages > 0 ? totalPages : 1}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    async function fetchAndDisplayFilteredRecords(page = 1) {
        currentPage = page;
        recordsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">Loading...</td></tr>`;
        const params = new URLSearchParams();
        if (searchInput.value) params.append('search', searchInput.value.trim());
        if (departmentFilter.value) params.append('department', departmentFilter.value);
        if (facultyFilter.value) params.append('faculty', facultyFilter.value);
        if (genderFilter.value) params.append('gender', genderFilter.value);
        if (statusFilter.value) params.append('healthStatus', statusFilter.value);
        
        params.append('page', currentPage);
        params.append('limit', 10);
        
        const queryString = params.toString();
        const apiUrl = `https://student-health-backend.onrender.com/api/students?${queryString}`;
        try {
            const response = await fetch(apiUrl, { headers: getAuthHeaders() });
            if (response.status === 401) { window.location.href = 'login.html.html'; return; }
            if (!response.ok) throw new Error(`API Error (${response.status})`);
            
            const data = await response.json();
            totalPages = data.totalPages;
            displayStudentRecords(data.students);
            renderPaginationControls();
        } catch (error) {
            console.error('Error fetching filtered records:', error);
            recordsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red; padding: 2rem;">Error loading records.</td></tr>`;
        }
    }
    
    async function initialSetup() {
        try {
            // This initial fetch gets ALL students just for populating filters.
            // A more optimized approach for very large datasets would be a separate API endpoint for filter options.
            const initialResponse = await fetch('https://student-health-backend.onrender.com/api/students', { headers: getAuthHeaders() });
            if (initialResponse.status === 401) { window.location.href = 'login.html.html'; return; }
            if (!initialResponse.ok) throw new Error(`HTTP error! Status: ${initialResponse.status}`);
            
            // ***** THIS IS THE FIX *****
            const initialData = await initialResponse.json();
            // The API returns an object { students: [...] }, so we need to access the .students property
            const allStudentsForDropdowns = initialData.students || []; 
            // **************************
            
            const departments = new Set(allStudentsForDropdowns.map(s => s.department).filter(Boolean));
            const faculties = new Set(allStudentsForDropdowns.map(s => s.faculty).filter(Boolean));
            const genders = new Set(allStudentsForDropdowns.map(s => s.gender).filter(Boolean));
            const statuses = new Set(allStudentsForDropdowns.map(s => s.healthStatus).filter(Boolean));

            populateSelectWithOptions(departmentFilter, departments);
            populateSelectWithOptions(facultyFilter, faculties);
            populateSelectWithOptions(genderFilter, genders);
            populateSelectWithOptions(statusFilter, statuses);
            
            // Now, fetch the first page of data to display
            fetchAndDisplayFilteredRecords(1);
        } catch (error) {
            console.error('CRITICAL ERROR during initial page setup:', error);
            recordsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red; padding: 2rem;">Error initializing page.</td></tr>`;
        }
    }

    // --- Event Listeners ---
    [searchInput, departmentFilter, facultyFilter, genderFilter, statusFilter].forEach(element => {
        if (element) {
            element.addEventListener(element.tagName === 'SELECT' ? 'change' : 'keyup', () => fetchAndDisplayFilteredRecords(1));
        }
    });

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            departmentFilter.value = '';
            facultyFilter.value = '';
            genderFilter.value = '';
            statusFilter.value = '';
            fetchAndDisplayFilteredRecords(1);
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchAndDisplayFilteredRecords(currentPage - 1);
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                fetchAndDisplayFilteredRecords(currentPage + 1);
            }
        });
    }

    // Action button listener
    recordsBody.addEventListener('click', async (event) => {
        const target = event.target.closest('button, a.edit-btn');
        if (!target) return; 
        
        if (target.tagName === 'A' && target.href.includes('viewfull-records.html')) {
            return; 
        }

        const studentId = target.dataset.id;
        if (!studentId) return;

        if (target.classList.contains('edit-btn')) {
            localStorage.setItem('editId', studentId);
            window.location.href = 'edit-record.html'; 
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete this record?`)) {
                try {
                    const response = await fetch(`https://student-health-backend.onrender.com/api/students/${studentId}`, { method: 'DELETE', headers: getAuthHeaders() });
                    if (response.ok) {
                        alert('Record deleted successfully');
                        fetchAndDisplayFilteredRecords(currentPage); // Re-fetch the current page to update view
                    } else {
                        const errorData = await response.json().catch(() => ({ message: 'Failed to delete.' }));
                        alert(`Failed to delete: ${errorData.message}`);
                    }
                } catch (error) {
                    alert(`Error deleting: ${error.message}`);
                }
            }
        } else if (target.classList.contains('download-btn')) { 
            try {
                const response = await fetch(`https://student-health-backend.onrender.com/api/students/${studentId}`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('Could not fetch full record for download.');
                const studentToDownload = await response.json();
                
                const filename = `student_record_${(studentToDownload.fullName || studentId).replace(/\s+/g, '_')}.doc`;
                let htmlContent = `<html><head><meta charset="UTF-8"><title>Student Record</title></head><body><h1>Student Health Record for ${studentToDownload.fullName || ''}</h1>`;
                for(const key in studentToDownload) {
                    if (Object.prototype.hasOwnProperty.call(studentToDownload, key) && !key.startsWith('_') && key !== 'password' && key !== 'createdAt' && key !== 'updatedAt') {
                         const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                         let value = studentToDownload[key];
                         if(key === 'date_of_birth' && value) {
                             value = new Date(value).toLocaleDateString('en-GB');
                         }
                         htmlContent += `<p><strong>${formattedKey}:</strong> ${value || 'N/A'}</p>`;
                    }
                }
                htmlContent += `</body></html>`;

                const blob = new Blob([htmlContent], { type: 'application/msword' }); 
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                 alert('Error preparing download: ' + error.message);
            }
        }
    });

    initialSetup(); 
});
