<?php
declare(strict_types=1);

/**
 * Send a JSON response and set HTTP status code
 *
 * @param array $data  Data to send as JSON
 * @param int   $status HTTP status code (default 200)
 */
function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
?>