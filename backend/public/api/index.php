<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';
require __DIR__ . '/../../src/profile.php'; // Added for ViewProfile

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // ok for demo

$route = $_GET['r'] ?? 'tooltip';

try {
    if ($route === 'tooltip' || $route === 'message') {
        $pdo = db();

        // Retrieve ONE message (latest or first, your choice)
        $stmt = $pdo->query("SELECT message FROM demo_messages ORDER BY id DESC LIMIT 1");
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'No message found'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        echo json_encode(['message' => $row['message']], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($route === 'health') {
        echo json_encode(['ok' => true, 'time' => date('c')], JSON_UNESCAPED_SLASHES);
        exit;
    }

     /* -------------------------------------------------------
     * ViewProfile routes (added by soojung)
     * ------------------------------------------------------- */

    // Get profile of the logged-in user
    // GET ?r=getProfile
    if ($route === 'getProfile') {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'GET required'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        get_profile();
    }

    // Update profile fields of the logged-in user
    // POST ?r=updateProfile
    if ($route === 'updateProfile') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'POST required'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        update_profile($body);
    }

    // Upload profile image for the logged-in user
    // POST ?r=uploadImage (multipart/form-data)
    if ($route === 'uploadImage') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'POST required'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        upload_profile_image();
    }
    /* ------------------------------------------------------- */

    http_response_code(404);
    echo json_encode(['error' => 'Unknown route'], JSON_UNESCAPED_SLASHES);
}
catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error'], JSON_UNESCAPED_SLASHES);
}