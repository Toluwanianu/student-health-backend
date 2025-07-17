// File: dashboard.js
// Final corrected version with all functionality: sidebar, dark mode, stats, charts, and secure API calls.

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DashboardJS] DOMContentLoaded: Page is ready.');
    
    // --- Element References ---
    // This script assumes your dashboard.html has elements with these exact IDs.
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContentArea = document.getElementById('mainContentArea');
    const htmlElement = document.documentElement; 
    const navbarLogoutButton = document.getElementById('navbarLogoutButton');
    const sidebarLogoutButton = document.getElementById('sidebarLogoutButton');
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    const darkModeToggleButton = document.getElementById('darkModeToggle');
    const totalStudentsStatElement = document.getElementById('totalStudentsStat');
    const recentEntriesStatElement = document.getElementById('recentEntriesStat'); 
    const alertsStatElement = document.getElementById('alertsStat'); 
    const unreadMessagesStatElement = document.getElementById('unreadMessagesStat'); // Reference for the new card

    let departmentChartCtx = document.getElementById('departmentChart')?.getContext('2d');
    let genderChartCtx = document.getElementById('genderChart')?.getContext('2d');
    let departmentBarChart = null;
    let genderPieChart = null;

    // --- Helper function to get Authorization Headers ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- Core Functions ---
    function applyTheme(theme) {
        htmlElement.classList.toggle('dark', theme === 'dark');
        if (typeof fetchDataForCharts === 'function' && (departmentChartCtx || genderChartCtx)) {
             fetchDataForCharts(true); 
        }
    }

    function initializeSidebar() {
        if (!sidebar || !mainContentArea) return;
        if (window.innerWidth < 768) { 
            sidebar.classList.add('-translate-x-full');
            mainContentArea.style.marginLeft = '0';
        } else { 
            const isCollapsed = localStorage.getItem('sidebarDesktopCollapsed') === 'true';
            sidebar.classList.toggle('collapsed', isCollapsed);
            sidebar.classList.remove('-translate-x-full');
            mainContentArea.style.marginLeft = isCollapsed ? '4.5rem' : '16rem';
        }
    }

    function handleLogout() {
        localStorage.clear(); 
        window.location.href = 'login.html.html';
    }

    async function fetchSummaryStats() {
        if (!totalStudentsStatElement) return;
        totalStudentsStatElement.textContent = '...';
        recentEntriesStatElement.textContent = '...';
        alertsStatElement.textContent = '...';
        if (unreadMessagesStatElement) unreadMessagesStatElement.textContent = '...'; // Set loading state for new card
        
        try {
            const response = await fetch('https://student-health-backend.onrender.com/api/stats/summary', { headers: getAuthHeaders() });
            if (response.status === 401) { window.location.href = 'login.html.html'; return; }
            if (!response.ok) throw new Error(`API error fetching stats: ${response.status}`);
            
            const stats = await response.json();
            
            // Populate all stat cards, including the new one
            totalStudentsStatElement.textContent = stats.totalStudents;
            recentEntriesStatElement.textContent = stats.recentEntries;
            alertsStatElement.textContent = stats.activeAlerts;
            if (unreadMessagesStatElement) unreadMessagesStatElement.textContent = stats.unreadConversations; // Update unread messages

        } catch (error) {
            console.error('[DashboardJS] Failed to fetch summary stats:', error);
            totalStudentsStatElement.textContent = 'Error';
            recentEntriesStatElement.textContent = 'Error';
            alertsStatElement.textContent = 'Error';
            if (unreadMessagesStatElement) unreadMessagesStatElement.textContent = 'Error';
        }
    }

    async function fetchDataForCharts(themeChanged = false) { 
        if (!departmentChartCtx && !genderChartCtx) return;
        try {
            const apiUrl = 'https://student-health-backend.onrender.com/api/students';
            const response = await fetch(apiUrl, { headers: getAuthHeaders() });
            if (response.status === 401) { window.location.href = 'login.html.html'; return; }
            if (!response.ok) throw new Error(`API Error (${response.status})`);
            
            const data = await response.json();
            const students = data.students || data;

            if (!students || !Array.isArray(students) || students.length === 0) {
                console.log('[DashboardJS] No student data available for charts.');
                return;
            }
            const departmentCounts = students.reduce((acc, student) => {
                const dept = student.department || 'Unknown';
                acc[dept] = (acc[dept] || 0) + 1;
                return acc;
            }, {});
            renderDepartmentChart(Object.keys(departmentCounts), Object.values(departmentCounts));

            const genderCounts = students.reduce((acc, student) => {
                const gender = student.gender || 'Unknown';
                acc[gender] = (acc[gender] || 0) + 1;
                return acc;
            }, {});
            renderGenderChart(Object.keys(genderCounts), Object.values(genderCounts));
        } catch (error) {
            console.error('[DashboardJS] CRITICAL ERROR fetching chart data:', error);
        }
    }

    function getChartColors() {
        const isDarkMode = htmlElement.classList.contains('dark');
        return {
            gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            labelColor: isDarkMode ? '#9ca3af' : '#6b7280', 
            titleColor: isDarkMode ? '#d1d5db' : '#374151', 
            barBgColor: isDarkMode ? 'rgba(99, 102, 241, 0.7)' : 'rgba(59, 130, 246, 0.5)', 
            barBorderColor: isDarkMode ? 'rgba(99, 102, 241, 1)' : 'rgba(59, 130, 246, 1)',
            pieBgColors: isDarkMode ? ['rgba(219, 39, 119, 0.7)', 'rgba(99, 102, 241, 0.7)', 'rgba(234, 179, 8, 0.7)', 'rgba(16, 185, 129, 0.7)'] : ['rgba(236, 72, 153, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(251, 191, 36, 0.6)', 'rgba(16, 185, 129, 0.6)'],
            pieBorderColors: isDarkMode ? ['rgba(219, 39, 119, 1)', 'rgba(99, 102, 241, 1)', 'rgba(234, 179, 8, 1)', 'rgba(13, 148, 136, 1)'] : ['rgba(236, 72, 153, 1)', 'rgba(59, 130, 246, 1)', 'rgba(251, 191, 36, 1)', 'rgba(16, 185, 129, 1)']
        };
    }

    function renderDepartmentChart(labels, data) {
        if (!departmentChartCtx) return;
        if (departmentBarChart) departmentBarChart.destroy();
        const colors = getChartColors();
        departmentBarChart = new Chart(departmentChartCtx, {
            type: 'bar', data: { labels: labels, datasets: [{ label: 'Students per Department', data: data, backgroundColor: colors.barBgColor, borderColor: colors.barBorderColor, borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, onClick: (event) => handleChartClick(event, departmentBarChart, 'department'), scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: colors.labelColor }, grid: { color: colors.gridColor } }, x: { ticks: { color: colors.labelColor }, grid: { color: colors.gridColor } }}, plugins: { legend: { display: true, position: 'bottom', labels: { color: colors.labelColor } }, title: { display: true, text: 'Student Distribution by Department', font: { size: 16 }, color: colors.titleColor }}}
        });
    }

    function renderGenderChart(labels, data) {
        if (!genderChartCtx) return;
        if (genderPieChart) genderPieChart.destroy();
        const colors = getChartColors();
        genderPieChart = new Chart(genderChartCtx, {
            type: 'pie', data: { labels: labels, datasets: [{ label: 'Gender Distribution', data: data, backgroundColor: colors.pieBgColors, borderColor: colors.pieBorderColors, borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, onClick: (event) => handleChartClick(event, genderPieChart, 'gender'), plugins: { legend: { display: true, position: 'right', labels: { color: colors.labelColor } }, title: { display: true, text: 'Student Gender Distribution', font: {size: 16}, color: colors.titleColor }}}
        });
    }

    function handleChartClick(event, chart, filterType) {
        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (points.length) {
            const label = chart.data.labels[points[0].index];
            const filterParam = encodeURIComponent(label);
            window.location.href = `view-records.html?${filterType}=${filterParam}`;
        }
    }
    
    // --- Event Listeners Setup ---
    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', () => {
            const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth >= 768) { 
                const shouldBeCollapsed = !sidebar.classList.contains('collapsed');
                sidebar.classList.toggle('collapsed', shouldBeCollapsed);
                mainContentArea.style.marginLeft = shouldBeCollapsed ? '4.5rem' : '16rem';
                localStorage.setItem('sidebarDesktopCollapsed', shouldBeCollapsed);
            } else { 
                sidebar.classList.toggle('-translate-x-full');
            }
        });
    }
    if (navbarLogoutButton) navbarLogoutButton.addEventListener('click', handleLogout);
    if (sidebarLogoutButton) sidebarLogoutButton.addEventListener('click', handleLogout);
    window.addEventListener('resize', initializeSidebar);
    
    // --- Initial Page Load ---
    const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(initialTheme);
    
    initializeSidebar();
    fetchSummaryStats();
    fetchDataForCharts(); 
});
