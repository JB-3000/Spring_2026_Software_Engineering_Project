<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';
require __DIR__ . '/../../src/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'POST required'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

$email = isset($data['email']) ? trim((string)$data['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response([
        'ok' => true,
        'message' => 'If an account exists for that email, a confirmation code has been sent.'
    ], 200);
}

$pdo = db();

$stmt = $pdo->prepare("SELECT id, email, is_active FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && (int)$user['is_active'] === 1) {
    // Hardcoded code for testing
    $code = "123456";

    $code_hash = password_hash($code, PASSWORD_DEFAULT);
    $expires_at = (new DateTimeImmutable('+15 minutes'))->format('Y-m-d H:i:s');

    $ins = $pdo->prepare("
        INSERT INTO password_resets (user_id, code_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, NULL, NOW())
    ");
    $ins->execute([(int)$user['id'], $code_hash, $expires_at]);

    /*
    // EMAIL SENDING — DISABLED FOR NOW
    require_once __DIR__ . '/../../src/send_mail.php';
    try {
        send_password_reset_code((string)$user['email'], $code);
    } catch (Throwable $e) {
        error_log('Password reset email failed: ' . $e->getMessage());
    }
    */
}

json_response([
    'ok' => true,
    'message' => 'If an account exists for that email, a confirmation code has been sent.'
], 200);