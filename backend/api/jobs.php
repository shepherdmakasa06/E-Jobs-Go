<?php
session_start();
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : null;

    if ($action === 'categories') {
        $query = "SELECT category, COUNT(*) as count FROM jobs WHERE status = 'open' GROUP BY category ORDER BY count DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $categories = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($categories, $row);
        }
        http_response_code(200);
        echo json_encode($categories);
        exit();
    }

    $customer_id = isset($_GET['customer_id']) ? $_GET['customer_id'] : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;
    
    if ($customer_id) {
        $query = "SELECT j.*, u.full_name as customer_name FROM jobs j JOIN users u ON j.customer_id = u.id WHERE j.customer_id = :customer_id ORDER BY j.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':customer_id', $customer_id);
    } else {
        $query = "SELECT j.*, u.full_name as customer_name FROM jobs j JOIN users u ON j.customer_id = u.id WHERE j.status = 'open' ORDER BY j.created_at DESC";
        if ($limit) {
            $query .= " LIMIT " . $limit; // Direct concat since it's intval sanitized
        }
        $stmt = $conn->prepare($query);
    }
    
    $stmt->execute();
    $jobs = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($jobs, $row);
    }
    
    http_response_code(200);
    echo json_encode($jobs);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->customer_id) && !empty($data->title) && !empty($data->description)) {
        $query = "INSERT INTO jobs (customer_id, title, description, category, budget, is_remote) VALUES (:customer_id, :title, :description, :category, :budget, :is_remote)";
        $stmt = $conn->prepare($query);
        
        $stmt->bindParam(':customer_id', $data->customer_id);
        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':description', $data->description);
        
        $category = isset($data->category) ? $data->category : null;
        $budget = isset($data->budget) ? $data->budget : null;
        $is_remote = isset($data->is_remote) ? ($data->is_remote ? 1 : 0) : 0;
        
        $stmt->bindParam(':category', $category);
        $stmt->bindParam(':budget', $budget);
        $stmt->bindParam(':is_remote', $is_remote, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Job created successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to create job."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
}
?>
