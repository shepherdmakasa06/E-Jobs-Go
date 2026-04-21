<?php
require_once 'backend/config/database.php';

try {
    // Add is_remote column to jobs
    $conn->exec("ALTER TABLE jobs ADD COLUMN is_remote BOOLEAN DEFAULT FALSE AFTER category");
    echo "Successfully added is_remote column to jobs.\n";
} catch(PDOException $e) {
    echo "Error adding is_remote (might already exist): " . $e->getMessage() . "\n";
}
?>
