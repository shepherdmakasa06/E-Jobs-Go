document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Logging in...';
            
            try {
                const res = await fetch(`${API_URL}/auth.php?action=login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    localStorage.setItem('ejobs_user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert(data.message || 'Login failed', 'error');
                }
            } catch (err) {
                showAlert('Network error. Is the PHP server running?', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Log In';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = registerForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Registering...';

            // Use FormData for file upload
            const formData = new FormData(registerForm);

            try {
                const res = await fetch(`${API_URL}/auth.php?action=register`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    showAlert('Registration successful! Redirecting to login...', 'success');
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                } else {
                    showAlert(data.message || 'Registration failed', 'error');
                }
            } catch (err) {
                showAlert('Network error. Is the PHP server running?', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign Up';
            }
        });
    }
});
