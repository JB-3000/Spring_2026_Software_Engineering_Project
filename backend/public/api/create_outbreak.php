<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';

session_start();

// CORS headers (tighten origin in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'You must be logged in to submit a report']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON body']);
    exit;
}

$diseaseType = trim((string)($input['diseaseType'] ?? ''));
$location    = trim((string)($input['location'] ?? ''));

if ($diseaseType === '' || $location === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Disease and Location are required']);
    exit;
}

try {
    $pdo = db();
    $userId = (int)$_SESSION['user_id'];

    $stmt = $pdo->prepare("
        INSERT INTO outbreaks 
        (disease, state, cases, report_date, created_at, disease_type, User_ID, status)
        VALUES (:disease, :state, :cases, NOW(), NOW(), :disease_type, :user_id, :status)
    ");

    $stmt->execute([
        ':disease'      => $diseaseType,
        ':state'        => $location,
        ':cases'        => 1,
        ':disease_type' => 'animal',           // or 'animal' — adjust as needed
        ':user_id'      => $userId,
        ':status'       => 'pending'
    ]);

    $insertId = $pdo->lastInsertId();

    echo json_encode([
        'ok'        => true,
        'message'   => 'Outbreak report created successfully',
        'insert_id' => $insertId
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}