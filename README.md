# SignalScope

A browser-based education data analytics dashboard. Upload a CSV of student data to instantly preview records, surface data-quality issues, calculate key statistics, and visualize performance.

## Features

- **CSV Upload & Preview** — Drag-free file picker with instant table preview
- **Automatic Summary** — Total students, total columns, average marks, average attendance, top student, grade spread
- **Data Quality Analysis** — Missing values and duplicate records
- **Validation & Error Handling** — Rejects empty files, header-only files, missing required columns, and non-CSV files renamed to `.csv`
- **Visualizations (Chart.js)**
  - Student Performance (bar)
  - Department Distribution (doughnut)
  - Average Marks by Department (bar)
  - Grade Distribution (bar)
- **Reset & Re-upload** — Clear the dashboard and upload a new dataset at any time
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

- HTML5
- CSS3 (Grid, Flexbox, media queries)
- Vanilla JavaScript
- [PapaParse](https://www.papaparse.com/) — CSV parsing
- [Chart.js](https://www.chartjs.org/) — data visualization

## Expected CSV Format

The uploaded CSV must contain these columns:
