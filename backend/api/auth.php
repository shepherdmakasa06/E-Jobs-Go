<?php
session_start();
require_once '../config/database.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Ensure uploads directory exists
$upload_dir = '../uploads/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // If it's multipart/form-data, data is in $_POST. If JSON, it's in php://input
    $data = $_POST;
    if (empty($data)) {
        $json = json_decode(file_get_contents("php://input"), true);
        if ($json) $data = $json;
    }

    if ($action === 'register') {
        if (!empty($data['full_name']) && !empty($data['email']) && !empty($data['password']) && !empty($data['role'])) {
            $query = "INSERT INTO users (full_name, email, password_hash, role, phone, location, skills, certificate_path) VALUES (:full_name, :email, :password_hash, :role, :phone, :location, :skills, :certificate_path)";
            $stmt = $conn->prepare($query);

            $password_hash = password_hash($data['password'], PASSWORD_BCRYPT);
            
            $stmt->bindParam(':full_name', $data['full_name']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password_hash', $password_hash);
            $stmt->bindParam(':role', $data['role']);
            
            $phone = isset($data['phone']) ? $data['phone'] : null;
            $location = isset($data['location']) ? $data['location'] : null; // This acts as address
            $skills = isset($data['skills']) ? $data['skills'] : null;

            // Handle file upload
            $certificate_path = null;
            if (isset($_FILES['certificate']) && $_FILES['certificate']['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($_FILES['certificate']['name'], PATHINFO_EXTENSION);
                $filename = uniqid() . '.' . $ext;
                if (move_uploaded_file($_FILES['certificate']['tmp_name'], $upload_dir . $filename)) {
                    $certificate_path = 'backend/uploads/' . $filename;
                }
            }

            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':location', $location);
            $stmt->bindParam(':skills', $skills);
            $stmt->bindParam(':certificate_path', $certificate_path);

            try {
                if ($stmt->execute()) {
                    http_response_code(201);
                    echo json_encode(array("message" => "User was created."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Unable to create user."));
                }
            } catch(PDOException $e) {
                http_response_code(400);
                echo json_encode(array("message" => "Email already exists or error: " . $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Incomplete data."));
        }
    } elseif ($action === 'login') {
        if (!empty($data['email']) && !empty($data['password'])) {
            $query = "SELECT * FROM users WHERE email = :email LIMIT 0,1";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':email', $data['email']);
            $stmt->execute();
            
            $num = $stmt->rowCount();
            
            if ($num > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($data['password'], $row['password_hash'])) {
                    $_SESSION['user_id'] = $row['id'];
                    $_SESSION['role'] = $row['role'];
                    
                    // Return user data without password
                    unset($row['password_hash']);
                    
                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "Successful login.",
                        "user" => $row
                    ));
                } else {
                    http_response_code(401);
                    echo json_encode(array("message" => "Login failed. Password incorrect."));
                }
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "User not found."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Incomplete data."));
        }
    } elseif ($action === 'update') {
        // Update user profile (Settings)
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(array("message" => "Unauthorized."));
            exit();
        }

        $user_id = $_SESSION['user_id'];
        
        $query = "UPDATE users SET full_name = :full_name, phone = :phone, location = :location, skills = :skills";
        
        // Handle file upload
        $certificate_path = null;
        if (isset($_FILES['certificate']) && $_FILES['certificate']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['certificate']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $ext;
            if (move_uploaded_file($_FILES['certificate']['tmp_name'], $upload_dir . $filename)) {
                $certificate_path = 'backend/uploads/' . $filename;
                $query .= ", certificate_path = :certificate_path";
            }
        }
        
        // Handle password update if provided
        $password_hash = null;
        if (!empty($data['password'])) {
            $password_hash = password_hash($data['password'], PASSWORD_BCRYPT);
            $query .= ", password_hash = :password_hash";
        }
        
        $query .= " WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':full_name', $data['full_name']);
        
        $phone = isset($data['phone']) ? $data['phone'] : null;
        $location = isset($data['location']) ? $data['location'] : null;
        $skills = isset($data['skills']) ? $data['skills'] : null;
        
        $stmt->bindParam(':phone', $phone);
        $stmt->bindParam(':location', $location);
        $stmt->bindParam(':skills', $skills);
        
        if ($certificate_path) {
            $stmt->bindParam(':certificate_path', $certificate_path);
        }
        if ($password_hash) {
            $stmt->bindParam(':password_hash', $password_hash);
        }
        $stmt->bindParam(':id', $user_id);

        try {
            if ($stmt->execute()) {
                // Fetch updated user to return
                $sel = $conn->prepare("SELECT * FROM users WHERE id = :id");
                $sel->bindParam(':id', $user_id);
                $sel->execute();
                $row = $sel->fetch(PDO::FETCH_ASSOC);
                unset($row['password_hash']);
                
                http_response_code(200);
                echo json_encode(array("message" => "Profile updated successfully.", "user" => $row));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to update profile."));
            }
        } catch(PDOException $e) {
            http_response_code(400);
            echo json_encode(array("message" => "Error: " . $e->getMessage()));
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'logout') {
    session_destroy();
    http_response_code(200);
    echo json_encode(array("message" => "Logged out successfully."));
}
?>
