<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // okay for class/demo; tighten later

$route = $_GET['r'] ?? 'health';

if ($route === 'health') {
    echo json_encode(['ok' => true, 'time' => date('c')], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($route === 'tooltip') {
    // You can change the message anytime, frontend just consumes it.
    echo json_encode([
        'message' => 'Tip: Early reporting of livestock illness can reduce economic losses.',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Unknown route'], JSON_UNESCAPED_SLASHES);