<?php
// src/location.php
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/db.php';

function detect_location(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    $pdo = db();

    // 1. Check if user already has location saved
    $stmt = $pdo->prepare("SELECT city, state FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!empty($user['city']) && !empty($user['state'])) {
        json_response([
            'ok'         => true,
            'source'     => 'user',
            'ip_address' => null,
            'country'    => 'US',
            'region'     => (string)$user['state'],
            'city'       => (string)$user['city'],
        ], 200);
    }

    // 2. Get IP (supports proxies/load balancers)
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;

    // Clean IP (handle multiple forwarded IPs)
    $clean_ip = $ip ? trim(explode(',', $ip)[0]) : null;

    // allow private IPs (removed NO_PRIV_RANGE restriction)
    if (!$clean_ip || !filter_var($clean_ip, FILTER_VALIDATE_IP)) {
        json_response([
            'ok'         => true,
            'source'     => 'default',
            'ip_address' => $clean_ip,
            'country'    => 'US',
            'region'     => 'Unknown',
            'city'       => 'Unknown',
        ], 200);
    }

    // 3. Call IP geolocation API
    $api_url  = "http://ip-api.com/json/" . urlencode($clean_ip) . "?fields=status,country,regionName,city,query";
    $response = @file_get_contents($api_url);

    if (!$response) {
        json_response([
            'ok'         => true,
            'source'     => 'default',
            'ip_address' => $clean_ip,
            'country'    => 'US',
            'region'     => 'Unknown',
            'city'       => 'Unknown',
        ], 200);
    }

    $data = json_decode($response, true);

    if (!$data || $data['status'] !== 'success') {
        json_response([
            'ok'         => true,
            'source'     => 'default',
            'ip_address' => $clean_ip,
            'country'    => 'US',
            'region'     => 'Unknown',
            'city'       => 'Unknown',
        ], 200);
    }

    // 4. Success response
    json_response([
        'ok'         => true,
        'source'     => 'ip',
        'ip_address' => $data['query']      ?? $clean_ip,
        'country'    => $data['country']    ?? 'Unknown',
        'region'     => $data['regionName'] ?? 'Unknown',
        'city'       => $data['city']       ?? 'Unknown',
    ], 200);
}
?>