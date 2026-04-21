<?php
session_start();
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $provider_id = isset($_GET['provider_id']) ? $_GET['provider_id'] : null;
    $job_id = isset($_GET['job_id']) ? $_GET['job_id'] : null;
    
    if ($provider_id) {
        // Fetch provider's applications. Include customer info if needed
        $query = "SELECT a.*, j.title as job_title, j.is_remote, u.phone as customer_phone, u.location as customer_location 
                  FROM applications a 
                  JOIN jobs j ON a.job_id = j.id 
                  JOIN users u ON j.customer_id = u.id 
                  WHERE a.provider_id = :provider_id 
                  ORDER BY a.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':provider_id', $provider_id);
    } elseif ($job_id) {
        // Fetch applications for a specific job
        $query = "SELECT a.*, u.full_name as provider_name, u.skills, u.phone as provider_phone, u.location as provider_location, u.certificate_path 
                  FROM applications a 
                  JOIN users u ON a.provider_id = u.id 
                  WHERE a.job_id = :job_id 
                  ORDER BY a.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':job_id', $job_id);
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Provider ID or Job ID required."));
        exit();
    }
    
    $stmt->execute();
    $applications = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Hide customer details if not accepted/already done
        if ($provider_id && $row['status'] === 'pending') {
            unset($row['customer_phone']);
            unset($row['customer_location']);
        }
        array_push($applications, $row);
    }
    
    http_response_code(200);
    echo json_encode($applications);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = isset($data->action) ? $data->action : 'apply';

    if ($action === 'accept') {
        if (!empty($data->application_id) && !empty($data->job_id)) {
            try {
                $conn->beginTransaction();
                
                // Mark application as accepted
                $stmt1 = $conn->prepare("UPDATE applications SET status = 'accepted' WHERE id = :id");
                $stmt1->bindParam(':id', $data->application_id);
                $stmt1->execute();

                // Mark job as assigned
                $stmt2 = $conn->prepare("UPDATE jobs SET status = 'assigned' WHERE id = :job_id");
                $stmt2->bindParam(':job_id', $data->job_id);
                $stmt2->execute();

                // Optional: mark other applications for this job as rejected? 
                // We'll leave them pending or let the user decide.

                $conn->commit();
                http_response_code(200);
                echo json_encode(array("message" => "Application accepted and job assigned."));
            } catch(Exception $e) {
                $conn->rollBack();
                http_response_code(500);
                echo json_encode(array("message" => "Failed to accept application."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Incomplete data for accept action."));
        }
    } else {
        // Apply for job
        if (!empty($data->job_id) && !empty($data->provider_id)) {
            // check if already applied
            $check_query = "SELECT id FROM applications WHERE job_id = :job_id AND provider_id = :provider_id";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bindParam(':job_id', $data->job_id);
            $check_stmt->bindParam(':provider_id', $data->provider_id);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(array("message" => "You have already applied for this job."));
                exit();
            }
            
            $query = "INSERT INTO applications (job_id, provider_id, message) VALUES (:job_id, :provider_id, :message)";
            $stmt = $conn->prepare($query);
            
            $stmt->bindParam(':job_id', $data->job_id);
            $stmt->bindParam(':provider_id', $data->provider_id);
            
            $message = isset($data->message) ? $data->message : null;
            $stmt->bindParam(':message', $message);
            
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Application submitted successfully."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to submit application."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Incomplete data."));
        }
    }
}
?>
