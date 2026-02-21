<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';

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

    // New block added for LoginPage
    if ($route === 'login') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'POST required'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        $email = isset($data['email']) ? trim((string)$data['email']) : '';
        $password = isset($data['password']) ? (string)$data['password'] : '';

        if ($email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Missing email/password'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        $pdo = db();
        $stmt = $pdo->prepare("SELECT id, email, password, is_active FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || (int)$user['is_active'] !== 1) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Invalid credentials'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        if (!password_verify($password, (string)$user['password'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Invalid credentials'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        echo json_encode(['ok' => true, 'user_id' => (int)$user['id']], JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($route === 'health') {
        echo json_encode(['ok' => true, 'time' => date('c')], JSON_UNESCAPED_SLASHES);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Unknown route'], JSON_UNESCAPED_SLASHES);
}

catch (Throwable $e) {
    http_response_code(500);

    // TEMP: show the real error locally so we can debug
    $is_local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);

    if ($is_local) {
        echo json_encode([
            'error' => 'Server error',
            'detail' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ], JSON_UNESCAPED_SLASHES);
    } else {
        echo json_encode(['error' => 'Server error'], JSON_UNESCAPED_SLASHES);
    }
}

//catch (Throwable $e) {
//    http_response_code(500);
//    echo json_encode(['error' => 'Server error'], JSON_UNESCAPED_SLASHES);
//}
