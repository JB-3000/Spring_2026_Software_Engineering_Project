<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Livestock Epidemic Tracker</title>

<style>
body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #d9d9d9;
}

/* Top Header */
.header {
    text-align: center;
    padding: 20px 0 10px 0;
    background-color: #cfcfcf;
    border-bottom: 4px solid #6c63ff;
}

.header h1 {
    margin: 0;
    font-size: 36px;
    letter-spacing: 2px;
}

/* Nav Bar */
.navbar {
    text-align: center;
    padding: 10px;
    background-color: #cfcfcf;
}

.navbar button {
    margin: 0 8px;
    padding: 6px 18px;
    border: 1px solid #555;
    background-color: #e5e5e5;
    cursor: pointer;
}

.navbar button:hover {
    background-color: #d0d0d0;
}

/* Main Layout */
.container {
    display: flex;
    justify-content: center;
    gap: 40px;
    padding: 30px;
}

/* Left Panel */
.left-panel {
    width: 700px;
}

.history-btn {
    background: linear-gradient(90deg, #5f5cff, #7d73ff);
    color: white;
    border: none;
    padding: 12px 40px;
    border-radius: 20px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 20px;
}

.history-btn:hover {
    opacity: 0.9;
}

/* Map Box */
.map-box {
    border: 2px solid #444;
    background-color: #e6e6e6;
}

.map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #cfcfcf;
    padding: 8px 12px;
    border-bottom: 2px solid #444;
}

.map-header h3 {
    margin: 0;
}

.map-header button {
    margin-left: 8px;
    padding: 4px 10px;
    font-size: 12px;
}

.map-content {
    height: 350px;
    background: url("https://upload.wikimedia.org/wikipedia/commons/a/a4/Blank_US_Map_%28states_only%29.svg");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

/* Right Panel */
.right-panel {
    width: 350px;
    background-color: #cfcfcf;
    border: 2px solid #444;
    padding: 20px;
}

.right-panel h2 {
    text-align: center;
    margin-top: 0;
    font-size: 28px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #777;
    background-color: #eee;
    text-align: center;
    font-weight: bold;
}

.upload-btn {
    margin-top: 20px;
    width: 100%;
    padding: 12px;
    border-radius: 25px;
    border: none;
    font-size: 16px;
    background: linear-gradient(90deg, #5f5cff, #7d73ff);
    color: white;
    cursor: pointer;
}

.upload-btn:hover {
    opacity: 0.9;
}

/* Footer */
.footer {
    text-align: center;
    padding: 8px;
    background-color: #cfcfcf;
    border-top: 4px solid #6c63ff;
    font-size: 12px;
}
</style>
</head>

<body>

<div class="header">
    <h1>LIVESTOCK EPIDEMIC TRACKER</h1>
</div>

<div class="navbar">
    <button>Home</button>
    <button>News</button>
    <button>FAQ</button>
    <button>Log Out</button>
    <button>Data</button>
    <button>Profile</button>
</div>

<div class="container">

    <!-- LEFT SIDE -->
    <div class="left-panel">
        <button class="history-btn">View Report History</button>

        <div class="map-box">
            <div class="map-header">
                <h3>Outbreak Locations</h3>
                <div>
                    <button>Map View</button>
                    <button>List View</button>
                    <button>Export</button>
                </div>
            </div>
            <div class="map-content"></div>
        </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="right-panel">
        <h2>New Disease Entry</h2>

        <div class="form-group">
            <input type="text" placeholder="Disease Type">
        </div>

        <div class="form-group">
            <input type="text" placeholder="Location">
        </div>

        <div class="form-group">
            <input type="text" placeholder="Affected Animal">
        </div>

        <div class="form-group">
            <input type="text" placeholder="Mode of Diagnosis">
        </div>

        <button class="upload-btn">Upload</button>
    </div>

</div>

<div class="footer">
    2026 - JNWSL Corp ™
</div>

</body>
</html>