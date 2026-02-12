<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // ok for demo

$route = $_GET['r'] ?? 'tooltip';

try {
    if ($route === 'tooltip') {
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

    http_response_code(404);
    echo json_encode(['error' => 'Unknown route'], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error'], JSON_UNESCAPED_SLASHES);
}