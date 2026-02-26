<?php
declare(strict_types=1);

// Returns recent outbreaks grouped by disease.
// Output fields are tailored for the homepage "Recent Outbreaks" widget.

require __DIR__ . '/../../src/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // ok for demo

try {
    $pdo = db();

    // Group by disease and compute totals + date range.
    // "Most recent" is based on MAX(report_date), and we return all diseases.
    $stmt = $pdo->query("
        SELECT
            disease,
            SUM(cases)          AS total_cases,
            MIN(report_date)    AS first_report,
            MAX(report_date)    AS last_report
        FROM outbreaks
        GROUP BY disease
        ORDER BY last_report DESC
    ");

    $rows = $stmt->fetchAll();

    echo json_encode($rows, JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error'], JSON_UNESCAPED_SLASHES);
}
