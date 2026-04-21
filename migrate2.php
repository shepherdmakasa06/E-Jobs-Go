<?php
require_once 'backend/config/database.php';

try {
    $conn->exec("ALTER TABLE users ADD COLUMN certificate_path VARCHAR(255) NULL AFTER skills");
    echo "Successfully added certificate_path column to users.\n";
} catch(PDOException $e) {
    echo "Error adding certificate_path: " . $e->getMessage() . "\n";
}
?>
