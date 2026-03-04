<?php
declare(strict_types=1);

// Adjust this path if necessary to point to your actual db.php
require __DIR__ . '/../../src/db.php';

header('Content-Type: application/json; charset=utf-8');

// Only allow POST
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
$diseaseType    = trim((string)($input['diseaseType'] ?? ''));
$location       = trim((string)($input['location'] ?? ''));
$affectedAnimal = trim((string)($input['affectedAnimal'] ?? ''));

// Validation
if ($diseaseType === '' || $location === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Disease and Location required']);
    exit;
}

try {
    $pdo = db();

    // Ensure your table has these columns: disease, state, cases, report_date, created_at
    // Optional: add a column for animal_type if you want to save that too
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