<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$diseaseType = trim((string)($input['diseaseType'] ?? ''));
$location    = trim((string)($input['location'] ?? ''));

// Optional fields from React (not stored in DB)
$affectedAnimal = trim((string)($input['affectedAnimal'] ?? ''));
$diagnosisMode  = trim((string)($input['diagnosisMode'] ?? ''));

if ($diseaseType === '' || $location === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Disease and Location required']);
    exit;
}

try {
    $pdo = db();

    $stmt = $pdo->prepare("
        INSERT INTO outbreaks 
        (disease, state, cases, report_date, created_at)
        VALUES (?, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $diseaseType,
        $location,
        1  // default case count
    ]);

    echo json_encode([
        'ok' => true,
        'message' => 'Outbreak created successfully'
    ]);
}
catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database error']);
}