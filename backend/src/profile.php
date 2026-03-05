<?php
// src/profile.php
require_once __DIR__ . '/response.php';

// Get profile of the currently logged-in user
function get_profile(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT id, username,
                first_name AS firstName, last_name AS lastName,
                state, city, address, zip, email, phone,
                profile_img AS profileImg
         FROM users WHERE id = ?"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        json_response(['ok' => false, 'error' => 'User not found'], 404);
    }

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
function upload_profile_image(): void {
    if (!isset($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'Not logged in'], 401);
    }

    if (!isset($_FILES['image'])) {
        json_response(['ok' => false, 'error' => 'No image file provided'], 400);
    }

    $file         = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!in_array($file['type'], $allowedTypes)) {
        json_response(['ok' => false, 'error' => 'Only JPG, PNG, GIF, WEBP allowed'], 400);
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        json_response(['ok' => false, 'error' => 'Max file size is 5MB'], 400);
    }

    // Save to server uploads directory
    $uploadDir = "/data/web/CSE442/2026-Spring/cse-442c/uploads/profiles/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = "profile_" . $_SESSION['user_id'] . "_" . time() . "." . $ext;

    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
        json_response(['ok' => false, 'error' => 'Upload failed'], 500);
    }

    // Save image URL to database
    $imageUrl = "https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442c/uploads/profiles/" . $fileName;
    $pdo = db();
    $pdo->prepare("UPDATE users SET profile_img = ? WHERE id = ?")
        ->execute([$imageUrl, $_SESSION['user_id']]);

    json_response(['ok' => true, 'image_url' => $imageUrl], 200);
}

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