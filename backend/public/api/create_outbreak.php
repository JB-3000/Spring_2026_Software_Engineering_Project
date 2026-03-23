<?php
declare(strict_types=1);

// Adjust this path if necessary to point to your actual db.php
require __DIR__ . '/../../src/db.php';

// Start session (required for $_SESSION['user_id'])
session_start();

// === CORS headers (restrict origin in production to your frontend domain) ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true"); // Important for cookies/sessions
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

// Require login
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

// Map React field names to variables
$diseaseType = trim((string)($input['diseaseType'] ?? ''));
$location    = trim((string)($input['location'] ?? ''));

// Validation
if ($diseaseType === '' || $location === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Disease and Location are required']);
    exit;
}

try {
    $pdo = db();

    $userId = (int)$_SESSION['user_id']; // safe cast to integer

    $stmt = $pdo->prepare("
        INSERT INTO outbreaks 
        (disease, state, cases, report_date, created_at, User_ID)
        VALUES (:disease, :state, :cases, NOW(), NOW(), :user_id)
    ");

    $stmt->execute([
        ':disease'  => $diseaseType,
        ':state'    => $location,
        ':cases'    => 1,
        ':user_id'  => $userId
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