// Theme Management Removed

// Utility for showing alerts
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-msg');
    if(!alertBox) return;
    
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// API Config
const API_URL = 'http://localhost:8000/backend/api';

// Get Current User
function getUser() {
    const userStr = localStorage.getItem('ejobs_user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}
