let performanceChart = null;
let departmentChart = null;
let departmentAvgChart = null;
let gradeChart = null;

const csvFile = document.getElementById("csvFile");
const tableContainer = document.getElementById("tableContainer");

const REQUIRED_COLUMNS = ["Student_ID", "Department", "Attendance", "Marks", "Grade"];

// Chart.js Global Font and Color settings
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#8a8887"; // text-muted
Chart.defaults.borderColor = "#222222"; // border

function showError(message) {
    alert("⚠️ " + message);
}

function isLikelyCsv(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const bytes = new Uint8Array(e.target.result);
            for (let i = 0; i < bytes.length; i++) {
                const b = bytes[i];
                if (b < 9 || (b > 13 && b < 32)) {
                    resolve(false);
                    return;
                }
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

    if (!columns || columns.length === 0) {
        showError("The CSV file has no columns. Please upload a valid CSV.");
        return;
    }

    if (data.length === 0) {
        showError("The CSV file contains headers but no data rows.");
        return;
    }

    const missingColumns = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
    if (missingColumns.length > 0) {
        showError("Missing required column(s): " + missingColumns.join(", "));
        return;
    }

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

    if (validMarksRows.length) {
        const top = validMarksRows.reduce((best, r) => Number(r.Marks) > Number(best.Marks) ? r : best);
        document.getElementById("topStudent").textContent = (top.Student_ID || "N/A") + " (" + top.Marks + ")";
    } else {
        document.getElementById("topStudent").textContent = "—";
    }

    const grades = {};
    data.forEach(row => {
        const g = row.Grade?.toString().trim() || "Unknown";
        grades[g] = (grades[g] || 0) + 1;
    });
    document.getElementById("gradeSpread").textContent = Object.keys(grades).length ? Object.keys(grades).join(", ") : "—";

    // Generate Table
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.textContent = column;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    data.forEach(row => {
        const tr = document.createElement("tr");
        columns.forEach(column => {
            const td = document.createElement("td");
            td.textContent = row[column] ?? "";
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);

    // Trigger animations again for re-upload
    const summary = document.getElementById("summaryCards");
    const quality = document.getElementById("qualitySection");
    const charts = document.getElementById("chartsSection");
    const preview = document.getElementById("dataPreview");

    [summary, quality, charts, preview].forEach(el => el.classList.remove("fade-in"));
    void summary.offsetWidth; // trigger reflow
    [summary, quality, charts, preview].forEach(el => el.classList.add("fade-in"));

    // Destroy old charts before creating new ones
    destroyCharts();

    // 1. Student Performance
    performanceChart = new Chart(document.getElementById("performanceChart"), {
        type: "bar",
        data: {
            labels: data.map(r => r.Student_ID),
            datasets: [{
                label: "Student Marks",
                data: data.map(r => {
                    const v = Number(r.Marks);
                    return r.Marks?.trim() !== "" && Number.isFinite(v) ? v : null;
                }),
                backgroundColor: "#D41514",
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Department Distribution
    const departments = {};
    data.forEach(row => {
        const d = row.Department?.trim() || "Unknown";
        departments[d] = (departments[d] || 0) + 1;
    });
    departmentChart = new Chart(document.getElementById("departmentChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(departments),
            datasets: [{
                data: Object.values(departments),
                backgroundColor: ["#D41514", "#CDCBCA", "#8a8887", "#ffffff", "#550808"],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Avg Marks by Department
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
            datasets: [{
                label: "Average Marks",
                data: deptAvgs,
                backgroundColor: "#CDCBCA",
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 4. Grade Distribution
    gradeChart = new Chart(document.getElementById("gradeChart"), {
        type: "bar",
        data: {
            labels: Object.keys(grades),
            datasets: [{
                label: "Students",
                data: Object.values(grades),
                backgroundColor: "#ffffff",
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    alert("Dataset uploaded and displayed successfully!");
}

csvFile.addEventListener("change", async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const ok = await isLikelyCsv(file);
    if (!ok) {
        showError("That file does not look like a valid CSV.");
        csvFile.value = "";
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: handleCsvResults,
        error: function(error) {
            showError("Could not read the CSV file.");
        }
    });
});

function resetDashboard() {
    document.getElementById("csvFile").value = "";
    document.getElementById("tableContainer").innerHTML = "";
    document.getElementById("totalStudents").textContent = "0";
    document.getElementById("totalColumns").textContent = "0";
    document.getElementById("averageMarks").textContent = "0";
    document.getElementById("averageAttendance").textContent = "0";
    document.getElementById("missingValues").textContent = "0";
    document.getElementById("duplicateRecords").textContent = "0";
    document.getElementById("topStudent").textContent = "—";
    document.getElementById("gradeSpread").textContent = "—";
    destroyCharts();
}
