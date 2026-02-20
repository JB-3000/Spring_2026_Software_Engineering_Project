<?php
declare(strict_types=1);

// enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '0'); // don't display errors in response

// CORS headers for react frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// incl database connection
require_once __DIR__ . '/db.php';

try {
    // get json input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // validate input exists
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit();
    }
    
    // extract and trim fields
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    // server-side validation
    $errors = [];
    
    if (empty($firstName)) {
        $errors[] = 'First name is required';
    }
    
    if (empty($lastName)) {
        $errors[] = 'Last name is required';
    }
    
    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format';
    }
    
    if (empty($password)) {
        $errors[] = 'Password is required';
    } elseif (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters';
    }
    
    // return validation errors if any
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
        exit();
    }
    
    // get database connection
    $pdo = db();
    
    // check if email already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Email is already registered to an account. Please register with a different email address'
        ]);
        exit();
    }
    
    // hash password using bcrypt (auto-salted)
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // insert new user
    $stmt = $pdo->prepare('
        INSERT INTO users (first_name, last_name, email, password) 
        VALUES (?, ?, ?, ?)
    ');
    
    $stmt->execute([$firstName, $lastName, $email, $hashedPassword]);
    
    // success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully',
        'user_id' => (int)$pdo->lastInsertId()
    ]);
    
} catch (PDOException $e) {
    // database error
    error_log('Database error in create-account.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
    
} catch (Exception $e) {
    // general error
    error_log('Error in create-account.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred']);
}
?>