<?php
declare(strict_types=1);

// Adjust this path if necessary to point to your actual db.php
require __DIR__ . '/../../src/db.php';

// === CORS headers (for development - you can restrict later) ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST (after OPTIONS)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

// Map React names to PHP variables
$diseaseType = trim((string)($input['diseaseType'] ?? ''));
$location    = trim((string)($input['location'] ?? ''));

// Validation
if ($diseaseType === '' || $location === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Disease and Location required']);
    exit;
}

try {
    $pdo = db();

    // Table columns: disease, state, cases, report_date, created_at
    $stmt = $pdo->prepare("
        INSERT INTO outbreaks 
        (disease, state, cases, report_date, created_at)
        VALUES (:disease, :state, :cases, NOW(), NOW())
    ");

    $stmt->execute([
        ':disease' => $diseaseType,
        ':state'   => $location,
        ':cases'   => 1
    ]);

    echo json_encode([
        'ok' => true,
        'message' => 'Outbreak created successfully',
        'insert_id' => $pdo->lastInsertId()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}