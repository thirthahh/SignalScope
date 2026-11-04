# SignalScope

A browser-based education data analytics dashboard. Upload a CSV of student data to instantly preview records, surface data-quality issues, calculate key statistics, and visualize performance.

### [🚀 View the Live Demo Here](https://thirthahh.github.io/SignalScope/)

## Features

- **Premium UI:** A custom dark-mode interface using a high-contrast charcoal and cherry-red color palette, featuring modern typography (Space Grotesk & Inter) and smooth micro-animations.
- **CSV Upload & Preview:** Instant table preview of uploaded datasets.
- **Automatic Summary:** Total students, total columns, average marks, average attendance, top student, and grade spread.
- **Data Quality Analysis:** Automatically detects missing values and duplicate records.
- **Validation & Error Handling:** Rejects empty files, header-only files, missing required columns, and non-CSV files renamed to .csv.
- **Visualizations (Chart.js):** Four dynamic charts (Student Performance, Department Distribution, Average Marks by Department, and Grade Distribution) styled to match the dark theme.
- **Reset & Re-upload:** Clear the dashboard and upload a new dataset at any time.

## Expected CSV Format

The uploaded CSV **must** contain these exact columns. Missing columns will trigger an error message.

| Student_ID | Department | Attendance | Marks | Grade |
| :--- | :--- | :--- | :--- | :--- |
| S001 | Computer Science | 88 | 85 | A |
| S002 | Electrical | 80 | 74 | B |
| S003 | Mechanical | 92 | 90 | A |

## Tech Stack

- **Frontend:** HTML5, CSS3 (Grid, Flexbox, custom animations), Vanilla JavaScript
- **Libraries:** [PapaParse](https://www.papaparse.com/) (CSV parsing), [Chart.js](https://www.chartjs.org/) (data visualization)

## How to Run

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. Click **Import Dataset** and select a CSV file.
4. (Optional) To test with the sample data, upload the `signalscope_sample_education_data.csv` file provided in this repo.

No build step, no server, and no dependencies to install — everything runs locally in your browser and loads libraries from CDNs.

## Author

Theertha T — [Portfolio](https://thirthahh.github.io) · [GitHub](https://github.com/thirthahh) · [LinkedIn](https://www.linkedin.com/in/theertha-t-154093364)
