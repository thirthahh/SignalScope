let performanceChart = null;
let departmentChart = null;
let departmentAvgChart = null;
let gradeChart = null;

const csvFile = document.getElementById("csvFile");
const tableContainer = document.getElementById("tableContainer");

const REQUIRED_COLUMNS = ["Student_ID", "Department", "Attendance", "Marks", "Grade"];

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
        showError(
            "Missing required column(s): " + missingColumns.join(", ") +
            "\nExpected columns: " + REQUIRED_COLUMNS.join(", ")
        );
        return;
    }

    const validMarksRows = data.filter(row =>
        row.Marks?.toString().trim() !== "" &&
        Number.isFinite(Number(row.Marks)) &&
        Number(row.Marks) >= 0
    );

    const validAttendanceRows = data.filter(row =>
        row.Attendance?.toString().trim() !== "" &&
        Number.isFinite(Number(row.Attendance)) &&
        Number(row.Attendance) >= 0
    );

    if (validMarksRows.length === 0 && validAttendanceRows.length === 0) {
        showError("No valid numeric values found in Marks or Attendance columns.");
        return;
    }

    // Summary cards
    document.getElementById("totalStudents").textContent = data.length;
    document.getElementById("totalColumns").textContent = columns.length;

    const avgMarks = validMarksRows.length
        ? validMarksRows.reduce((s, r) => s + Number(r.Marks), 0) / validMarksRows.length
        : 0;
    document.getElementById("averageMarks").textContent = avgMarks.toFixed(2);

    const avgAtt = validAttendanceRows.length
        ? validAttendanceRows.reduce((s, r) => s + Number(r.Attendance), 0) / validAttendanceRows.length
        : 0;
    document.getElementById("averageAttendance").textContent = avgAtt.toFixed(2) + "%";

    // Missing values
    let missingCount = 0;
    data.forEach(row => {
        columns.forEach(column => {
            const v = row[column];
            if (v === null || v === undefined || String(v).trim() === "") missingCount++;
        });
    });
    document.getElementById("missingValues").textContent = missingCount;

    // Duplicates
    const uniqueRows = new Set();
    data.forEach(row => uniqueRows.add(JSON.stringify(columns.map(c => row[c]))));
    document.getElementById("duplicateRecords").textContent = data.length - uniqueRows.size;

    // Top student
    if (validMarksRows.length) {
        const top = validMarksRows.reduce((best, r) =>
            Number(r.Marks) > Number(best.Marks) ? r : best
        );
        document.getElementById("topStudent").textContent =
            (top.Student_ID || "N/A") + " (" + top.Marks + ")";
    } else {
        document.getElementById("topStudent").textContent = "—";
    }

    // Grade spread
    const grades = {};
    data.forEach(row => {
        const g = row.Grade?.toString().trim() || "Unknown";
        grades[g] = (grades[g] || 0) + 1;
    });
    document.getElementById("gradeSpread").textContent =
        Object.keys(grades).length ? Object.keys(grades).join(", ") : "—";

    // Preview table
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

    // Charts
    destroyCharts();

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
                backgroundColor: "#2563eb"
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
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
            datasets: [{
                data: Object.values(departments),
                backgroundColor: ["#2563eb", "#0f766e", "#f59e0b", "#9333ea", "#dc2626"]
            }]
        },
        options: { responsive: true }
    });

    const deptMarks = {};
    validMarksRows.forEach(row => {
        const d = row.Department?.trim() || "Unknown";
        if (!deptMarks[d]) deptMarks[d] = [];
        deptMarks[d].push(Number(row.Marks));
    });
    const deptLabels = Object.keys(deptMarks);
    const deptAvgs = deptLabels.map(d =>
        deptMarks[d].reduce((s, v) => s + v, 0) / deptMarks[d].length
    );
    departmentAvgChart = new Chart(document.getElementById("departmentAvgChart"), {
        type: "bar",
        data: {
            labels: deptLabels,
            datasets: [{
                label: "Average Marks",
                data: deptAvgs,
                backgroundColor: "#0f766e"
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    gradeChart = new Chart(document.getElementById("gradeChart"), {
        type: "bar",
        data: {
            labels: Object.keys(grades),
            datasets: [{
                label: "Students",
                data: Object.values(grades),
                backgroundColor: "#9333ea"
            }]
        },
        options: {
            responsive: true,
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
        showError("That file does not look like a valid CSV. Please upload a plain-text .csv file.");
        csvFile.value = "";
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: handleCsvResults,
        error: function(error) {
            showError("Could not read the CSV file. " + error.message);
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