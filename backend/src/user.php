require_once 'config.php';

class User {
    public static function getById($id) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id, username, email, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Example: Hash password for registration (not used here, but for completeness)
    public static function register($username, $email, $password) {
        $pdo = getDBConnection();
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (:username, :email, :hashed)");
        $stmt->execute(['username' => $username, 'email' => $email, 'hashed' => $hashed]);
        return $pdo->lastInsertId();
    }
}
?>