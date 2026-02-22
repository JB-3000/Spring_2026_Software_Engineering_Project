<?php
declare(strict_types=1);

require __DIR__ . '/../../src/db.php';
require __DIR__ . '/../../src/response.php';

/**
 * POST JSON: { "email": "user@example.com" }
 *
 * Always returns a generic success message (to avoid account enumeration).
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'POST required'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

$email = isset($data['email']) ? trim((string)$data['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // Still generic message to avoid leaks
    json_response([
        'ok' => true,
        'message' => 'If an account exists for that email, a confirmation code has been sent.'
    ], 200);
}

$pdo = db();

// Look up user (do NOT reveal whether they exist)
$stmt = $pdo->prepare("SELECT id, email, is_active FROM users WHERE email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

// If user exists + active, generate & store a one-time code and attempt to email it.
// If not, we do nothing but still return the same message.
if ($user && (int)$user['is_active'] === 1) {
    // 6-digit numeric code
    //$code = (string)random_int(100000, 999999);

    // TEMP: hardcoded code for testing (remove when implementing real email)
    $code = "123456";

    // Hash the code so it isn't stored in plaintext
    $code_hash = password_hash($code, PASSWORD_DEFAULT);

    // Expire in 15 minutes
    $expires_at = (new DateTimeImmutable('+15 minutes'))->format('Y-m-d H:i:s');

    // Save reset request
    $ins = $pdo->prepare("
        INSERT INTO password_resets (user_id, code_hash, expires_at, used_at, created_at)
        VALUES (?, ?, ?, NULL, NOW())
    ");
    $ins->execute([(int)$user['id'], $code_hash, $expires_at]);

    // Try to send email. If email fails, we still return generic ok.
    require_once __DIR__ . '/../../src/send_mail.php';
    try {
        send_password_reset_code((string)$user['email'], $code);
    } catch (Throwable $e) {
        // Log only; do not expose details to client
        error_log('Password reset email failed: ' . $e->getMessage());
    }
}

json_response([
    'ok' => true,
    'message' => 'If an account exists for that email, a confirmation code has been sent.'
], 200);