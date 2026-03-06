<?php
// src/profile.php
require_once __DIR__ . '/response.php';

// Get profile of the currently logged-in user
function get_profile(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    $pdo  = db();
    try {
        $stmt = $pdo->prepare(
            "SELECT id,
                    first_name AS firstName, last_name AS lastName,
                    state, city, address, zip, email, phone,
                    profile_image AS profileImg
             FROM users WHERE id = ?"
        );
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        // Fallback for environments where optional profile columns are missing.
        $stmt = $pdo->prepare(
            "SELECT id,
                    first_name AS firstName, last_name AS lastName,
                    email
             FROM users WHERE id = ?"
        );
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$user) {
        json_response(['ok' => false, 'error' => 'User not found'], 404);
    }

    $user['state'] = (string)($user['state'] ?? '');
    $user['city'] = (string)($user['city'] ?? '');
    $user['address'] = (string)($user['address'] ?? '');
    $user['zip'] = (string)($user['zip'] ?? '');
    $user['phone'] = (string)($user['phone'] ?? '');
    $user['profileImg'] = (string)($user['profileImg'] ?? '');

    // Keep response shape stable for frontend even when users.username is not present.
    $user['username'] = trim(((string)($user['firstName'] ?? '')) . ' ' . ((string)($user['lastName'] ?? '')));

    json_response(array_merge(['ok' => true], $user), 200);
}

// Update profile fields for the currently logged-in user
function update_profile(array $body): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    $allowedFields = ['first_name', 'last_name', 'state', 'city', 'address', 'zip', 'email', 'phone'];
    $updates = [];
    $values  = [];

    foreach ($allowedFields as $field) {
        if (isset($body[$field])) {
            $updates[] = "$field = ?";
            $values[]  = htmlspecialchars(strip_tags((string)$body[$field]));
        }
    }

    if (empty($updates)) {
        json_response(['ok' => false, 'error' => 'No fields to update'], 400);
    }

    $values[] = $_SESSION['user_id'];
    $pdo = db();
    $pdo->prepare("UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?")
        ->execute($values);

    json_response(['ok' => true, 'message' => 'Profile updated'], 200);
}

// Upload and save profile image for the currently logged-in user
// (Disabled: frontend now uses a hardcoded default avatar URL instead of file upload)
/*
function upload_profile_image(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    if (!isset($_FILES['image'])) {
        json_response(['ok' => false, 'error' => 'No image file provided'], 400);
    }

    $file         = $_FILES['image'];
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
    ];

    $uploadErrorMessages = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload_max_filesize limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form MAX_FILE_SIZE limit',
        UPLOAD_ERR_PARTIAL    => 'File upload was incomplete',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Server missing temporary upload directory',
        UPLOAD_ERR_CANT_WRITE => 'Server failed to write uploaded file',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by server extension',
    ];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $code = (int)$file['error'];
        $message = $uploadErrorMessages[$code] ?? 'Unknown upload error';
        json_response(['ok' => false, 'error' => $message, 'code' => $code], 400);
    }

    $mimeType = mime_content_type($file['tmp_name']) ?: '';
    if (!isset($allowedTypes[$mimeType])) {
        json_response(['ok' => false, 'error' => 'Only JPG, PNG, GIF, WEBP allowed'], 400);
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        json_response(['ok' => false, 'error' => 'Max file size is 5MB'], 400);
    }

    // Save to project-level uploads directory to avoid environment-specific absolute paths.
    $projectRoot = dirname(__DIR__, 2);
    $uploadDir = $projectRoot . "/uploads/profiles/";

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        json_response(['ok' => false, 'error' => 'Could not create upload directory'], 500);
    }
    if (!is_writable($uploadDir)) {
        json_response(['ok' => false, 'error' => 'Upload directory is not writable'], 500);
    }

    $ext      = $allowedTypes[$mimeType];
    $fileName = "profile_" . $_SESSION['user_id'] . "_" . time() . "." . $ext;

    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
        json_response(['ok' => false, 'error' => 'Failed to move uploaded file'], 500);
    }

    // Save image URL to database
    $imageUrl = "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/uploads/profiles/" . $fileName;
    $pdo = db();
    $pdo->prepare("UPDATE users SET profile_image = ? WHERE id = ?")
        ->execute([$imageUrl, $_SESSION['user_id']]);

    json_response(['ok' => true, 'image_url' => $imageUrl], 200);
}
*/

// Delete the currently logged-in user's account and log out
function delete_account(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    $pdo = db();
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);

    session_destroy();

    json_response(['ok' => true, 'message' => 'Account deleted'], 200);
}
?>
