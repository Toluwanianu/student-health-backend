// import-records.js (Updated to send the JWT Authorization header)
document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFileInput');
    const uploadButton = document.getElementById('uploadButton');
    const fileChosenText = document.getElementById('file-chosen-text');
    const resultsContainer = document.getElementById('results-container');
    const resultsLog = document.getElementById('results-log');
    const downloadTemplateLink = document.getElementById('downloadTemplateLink');
    let parsedData = [];

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    // --- File Selection Logic ---
    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileChosenText.textContent = file.name;
            uploadButton.disabled = false;
            
            // Parse the selected file immediately
            Papa.parse(file, {
                header: true, // Use the first row as headers
                skipEmptyLines: true,
                dynamicTyping: true, // Automatically convert numbers, booleans
                complete: function(results) {
                    console.log("CSV parsing complete:", results);
                    if(results.errors.length > 0) {
                        alert("There were errors parsing the CSV file. Please check the file format.");
                        console.error("CSV Parsing Errors:", results.errors);
                        uploadButton.disabled = true;
                        return;
                    }
                    // Map headers to match Mongoose schema (if necessary)
                    parsedData = results.data.map(row => mapCsvRowToSchema(row));
                    resultsLog.textContent = `File parsed successfully. Found ${parsedData.length} records. Ready to upload.`;
                    resultsContainer.style.display = 'block';
                }
            });

        } else {
            fileChosenText.textContent = 'Choose a CSV file...';
            uploadButton.disabled = true;
            parsedData = [];
        }
    });

    // --- Upload Button Logic (with JWT header) ---
    uploadButton.addEventListener('click', async () => {
        if (parsedData.length === 0) {
            alert('No data to upload. Please choose a valid CSV file.');
            return;
        }
        
        uploadButton.disabled = true;
        uploadButton.textContent = 'Processing...';
        resultsLog.textContent = `Uploading ${parsedData.length} records...`;

        try {
            const apiUrl = 'https://dashing-daffodil-b7fcc1.netlify.app/api/students/bulk-import';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: getAuthHeaders(), // <-- ADDED AUTH HEADERS
                body: JSON.stringify({ students: parsedData }),
            });

            const resultData = await response.json();

            if (response.status === 401) {
                window.location.href = 'login.html.html';
                return;
            }

            if (response.ok) {
                resultsLog.textContent = `SUCCESS!\n\n${resultData.message}`;
            } else {
                 resultsLog.textContent = `ERROR:\n\n${resultData.message}\n\nDetails:\n${resultData.errorDetails || 'No additional details provided.'}`;
            }

        } catch (error) {
            console.error('Bulk import fetch error:', error);
            resultsLog.textContent = `A critical error occurred: ${error.message}`;
            alert(`An error occurred during upload. Please check the console.`);
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload and Process';
            // Clear parsed data to prevent re-uploading the same set
            parsedData = [];
            // Reset file input for security and usability
            csvFileInput.value = ''; 
            fileChosenText.textContent = 'Choose a different CSV file...';
        }
    });

    // --- Header Mapping and Template Download ---
    const requiredHeaders = [
        "fullName", "matric_no", "medical_number", "department", "faculty", "age", "gender", 
        "genotype", "allergies", "current_complaint", "drugs_given", "healthStatus", 
        "date_of_birth", "level", "phone", "email", "address", 
        "medicalHistory", "healthComplaints", "hostelClinicVisits", "recentTreatments"
    ];

    function mapCsvRowToSchema(row) {
        // This function renames CSV headers to match your Mongoose schema if they are different.
        // For example, if your CSV has a "Student Name" column, you would map it to "fullName".
        const mappedRow = {};
        for(const key in row) {
            const trimmedKey = key.trim();
            // Example mapping:
            // if (trimmedKey === "Full Name") mappedRow["fullName"] = row[key];
            // else if (trimmedKey === "Matric Number") mappedRow["matric_no"] = row[key];
            // else if (requiredHeaders.includes(trimmedKey)) {
            //     mappedRow[trimmedKey] = row[key];
            // }

            // For now, assuming CSV headers directly match schema field names
            if (requiredHeaders.includes(trimmedKey)) {
                 mappedRow[trimmedKey] = row[key];
            }
        }
        return mappedRow;
    }

    downloadTemplateLink.addEventListener('click', (event) => {
        event.preventDefault();
        // Create a CSV string from the required headers
        const csvContent = "data:text/csv;charset=utf-8," + requiredHeaders.join(',');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

});
