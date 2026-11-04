// ==========================================
// 1. PAGE TRANSITIONS
// ==========================================
function enterDashboard() {
    const landing = document.getElementById('landing-page');
    const dash = document.getElementById('dashboard');
    
    landing.style.opacity = '0';
    setTimeout(() => {
        landing.style.display = 'none';
        dash.style.display = 'block';
        // Trigger the dashboard fade-in
        setTimeout(() => dash.classList.add('visible'), 50);
    }, 300);
}

function goHome() {
    const landing = document.getElementById('landing-page');
    const dash = document.getElementById('dashboard');
    
    dash.classList.remove('visible');
    setTimeout(() => {
        dash.style.display = 'none';
        landing.style.display = 'block';
        setTimeout(() => landing.style.opacity = '1', 50);
    }, 300);
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 2. MAGNETIC BUTTONS
// ==========================================
const magneticBtns = document.querySelectorAll('.magnetic');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(0px, 0px)`;
    });
});

// ==========================================
// 3. SCROLL REVEAL & COUNTER ANIMATIONS
// ==========================================
const observerOptions = { threshold: 0.2 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('hero-preview')) {
                animateCounters();
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.scroll-reveal, .hero-preview').forEach(el => observer.observe(el));

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const duration = 2000; 
        const startTime = performance.now();
        const isPercent = counter.innerText.includes('%');
        const isDecimal = target % 1 !== 0;
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = target * easeOut;
            
            if (isDecimal) {
                counter.innerText = currentValue.toFixed(1);
            } else {
                counter.innerText = Math.floor(currentValue);
            }
            
            if (isPercent) counter.innerText += '%';
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = isDecimal ? target.toFixed(1) : target;
                if (isPercent) counter.innerText += '%';
            }
        }
        requestAnimationFrame(updateCounter);
    });
}

// ==========================================
// 4. CSV & CHART LOGIC (Your existing code)
// ==========================================
let performanceChart = null;
let departmentChart = null;
let departmentAvgChart = null;
let gradeChart = null;

const csvFile = document.getElementById("csvFile");
const REQUIRED_COLUMNS = ["Student_ID", "Department", "Attendance", "Marks", "Grade"];

function showError(message) { alert("⚠️ " + message); }

function isLikelyCsv(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const bytes = new Uint8Array(e.target.result);
            for (let i = 0; i < bytes.length; i++) {
                const b = bytes[i];
                if (b < 9 || (b > 13 && b < 32)) { resolve(false); return; }
            }
            resolve(true);
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 200));
    });
}

function destroyCharts() {
    if (performanceChart) { performanceChart.destroy(); performanceChart = null; }
    if (departmentChart) { departmentChart.destroy(); departmentChart = null; }
    if (departmentAvgChart) { departmentAvgChart.destroy(); departmentAvgChart = null; }
    if (gradeChart) { gradeChart.destroy(); gradeChart = null; }
}

function handleCsvResults(results) {
    const data = results.data;
    const columns = results.meta.fields;

    if (!columns || columns.length === 0) { showError("The CSV file has no columns."); return; }
    if (data.length === 0) { showError("The CSV contains headers but no data."); return; }

    const missingColumns = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
    if (missingColumns.length > 0) { showError("Missing column(s): " + missingColumns.join(", ")); return; }

    const validMarksRows = data.filter(row => row.Marks?.toString().trim() !== "" && Number.isFinite(Number(row.Marks)));
    const validAttendanceRows = data.filter(row => row.Attendance?.toString().trim() !== "" && Number.isFinite(Number(row.Attendance)));

    document.getElementById("totalStudents").textContent = data.length;
    document.getElementById("totalColumns").textContent = columns.length;

    const avgMarks = validMarksRows.length ? validMarksRows.reduce((s, r) => s + Number(r.Marks), 0) / validMarksRows.length : 0;
    document.getElementById("averageMarks").textContent = avgMarks.toFixed(2);

    const avgAtt = validAttendanceRows.length ? validAttendanceRows.reduce((s, r) => s + Number(r.Attendance), 0) / validAttendanceRows.length : 0;
    document.getElementById("averageAttendance").textContent = avgAtt.toFixed(2) + "%";

    let missingCount = 0;
    data.forEach(row => {
        columns.forEach(column => {
            const v = row[column];
            if (v === null || v === undefined || String(v).trim() === "") missingCount++;
        });
    });
    document.getElementById("missingValues").textContent = missingCount;

    const uniqueRows = new Set();
    data.forEach(row => uniqueRows.add(JSON.stringify(columns.map(c => row[c]))));
    document.getElementById("duplicateRecords").textContent = data.length - uniqueRows.size;

    // Build Table
    let tableHTML = "<tr>";
    columns.forEach(col => { tableHTML += `<th>${col}</th>`; });
    tableHTML += "</tr>";
    
    data.forEach(row => {
        tableHTML += "<tr>";
        columns.forEach(col => { tableHTML += `<td>${row[col] ?? ""}</td>`; });
        tableHTML += "</tr>";
    });
    document.getElementById("dataTable").innerHTML = tableHTML;

    destroyCharts();

    // Chart Options
    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#8A9A91' } },
            y: { grid: { color: '#2A2A2A' }, ticks: { color: '#8A9A91' } }
        }
    };

    // Charts
    performanceChart = new Chart(document.getElementById("performanceChart"), {
        type: "bar",
        data: {
            labels: data.map(r => r.Student_ID),
            datasets: [{ data: data.map(r => Number(r.Marks) || null), backgroundColor: "#A31C1B", borderRadius: 4 }]
        },
        options: chartOptions
    });

    const departments = {};
    data.forEach(row => {
        const d = row.Department?.trim() || "Unknown";
        departments[d] = (departments[d] || 0) + 1;
    });
    departmentChart = new Chart(document.getElementById("departmentChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(departments),
            datasets: [{ data: Object.values(departments), backgroundColor: ["#A31C1B", "#F0F0F0", "#8A9A91", "#2A2A2A"], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });

    const deptMarks = {};
    validMarksRows.forEach(row => {
        const d = row.Department?.trim() || "Unknown";
        if (!deptMarks[d]) deptMarks[d] = [];
        deptMarks[d].push(Number(row.Marks));
    });
    const deptLabels = Object.keys(deptMarks);
    const deptAvgs = deptLabels.map(d => deptMarks[d].reduce((s, v) => s + v, 0) / deptMarks[d].length);
    
    departmentAvgChart = new Chart(document.getElementById("departmentAvgChart"), {
        type: "bar",
        data: {
            labels: deptLabels,
            datasets: [{ data: deptAvgs, backgroundColor: "#F0F0F0", borderRadius: 4 }]
        },
        options: chartOptions
    });

    const grades = {};
    data.forEach(row => {
        const g = row.Grade?.toString().trim() || "Unknown";
        grades[g] = (grades[g] || 0) + 1;
    });
    gradeChart = new Chart(document.getElementById("gradeChart"), {
        type: "bar",
        data: {
            labels: Object.keys(grades),
            datasets: [{ data: Object.values(grades), backgroundColor: "#8A9A91", borderRadius: 4 }]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { beginAtZero: true, ticks: { stepSize: 1, color: '#8A9A91' }, grid: { color: '#2A2A2A' } } } }
    });

    alert("Dataset loaded successfully.");
}

csvFile.addEventListener("change", async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const ok = await isLikelyCsv(file);
    if (!ok) { showError("Not a valid CSV file."); csvFile.value = ""; return; }
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: handleCsvResults, error: function(error) { showError("Could not read the file."); } });
});

function resetDashboard() {
    document.getElementById("csvFile").value = "";
    document.getElementById("dataTable").innerHTML = "";
    document.getElementById("totalStudents").textContent = "0";
    document.getElementById("totalColumns").textContent = "0";
    document.getElementById("averageMarks").textContent = "0";
    document.getElementById("averageAttendance").textContent = "0";
    document.getElementById("missingValues").textContent = "0";
    document.getElementById("duplicateRecords").textContent = "0";
    destroyCharts();
}
