document.addEventListener('DOMContentLoaded', () => {
    let user = getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name').textContent = user.full_name;
    
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/auth.php?action=logout`);
        } catch(e) {}
        localStorage.removeItem('ejobs_user');
        window.location.href = 'index.html';
    });

    const sidebarNav = document.getElementById('sidebar-nav');
    const contentArea = document.getElementById('content-area');
    
    function renderSidebar() {
        if (user.role === 'customer') {
            sidebarNav.innerHTML = `
                <a href="#" class="active" data-view="my-jobs">📋 My Posted Jobs</a>
                <a href="#" data-view="post-job" onclick="document.getElementById('job-modal').style.display='flex'">➕ Post New Job</a>
                <a href="#" data-view="settings">⚙️ Settings</a>
            `;
            loadCustomerJobs();
        } else {
            sidebarNav.innerHTML = `
                <a href="#" class="active" data-view="find-jobs">🔍 Find Jobs</a>
                <a href="#" data-view="my-applications">📝 My Applications</a>
                <a href="#" data-view="settings">⚙️ Settings</a>
            `;
            loadAvailableJobs();
        }
    }
    renderSidebar();

    sidebarNav.addEventListener('click', (e) => {
        if(e.target.tagName === 'A' && e.target.dataset.view && e.target.dataset.view !== 'post-job') {
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.dataset.view;
            if(view === 'find-jobs') loadAvailableJobs();
            if(view === 'my-applications') loadProviderApplications();
            if(view === 'my-jobs') loadCustomerJobs();
            if(view === 'settings') loadSettings();
        }
    });

    const jobForm = document.getElementById('job-form');
    if (jobForm) {
        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('job-title').value;
            const category = document.getElementById('job-category').value;
            const budget = document.getElementById('job-budget').value;
            const description = document.getElementById('job-desc').value;
            const is_remote = document.getElementById('job-remote').checked;

            try {
                const res = await fetch(`${API_URL}/jobs.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer_id: user.id, title, category, budget, description, is_remote })
                });
                
                if (res.ok) {
                    showAlert('Job posted successfully!', 'success');
                    document.getElementById('job-modal').style.display = 'none';
                    jobForm.reset();
                    loadCustomerJobs();
                } else {
                    showAlert('Failed to post job.', 'error');
                }
            } catch (err) {
                showAlert('Network error.', 'error');
            }
        });
    }

    async function loadCustomerJobs() {
        contentArea.innerHTML = '<h3>My Posted Jobs</h3><p>Loading...</p>';
        try {
            const res = await fetch(`${API_URL}/jobs.php?customer_id=${user.id}`);
            const jobs = await res.json();
            
            if (jobs.length === 0) {
                contentArea.innerHTML = `
                    <h3>My Posted Jobs</h3>
                    <div class="card text-center mt-2">
                        <p class="text-secondary">You haven't posted any jobs yet.</p>
                        <button class="btn btn-primary mt-2" onclick="document.getElementById('job-modal').style.display='flex'">Post your first job</button>
                    </div>
                `;
                return;
            }

            let html = `<h3>My Posted Jobs</h3><div class="jobs-grid">`;
            for(let job of jobs) {
                let appsHtml = '';
                try {
                    const appRes = await fetch(`${API_URL}/applications.php?job_id=${job.id}`);
                    const apps = await appRes.json();
                    if(apps.length > 0) {
                        appsHtml = `<div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            <strong>Applications (${apps.length})</strong>
                            <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                                ${apps.map(a => `
                                <div style="background:var(--bg-primary); padding:0.5rem; border-radius:0.5rem; font-size:0.875rem;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <strong>${a.provider_name}</strong>
                                        ${job.status === 'open' && a.status === 'pending' ? `<button class="btn btn-primary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="acceptApplication(${a.id}, ${job.id})">Accept</button>` : `<span class="badge badge-${a.status === 'accepted' ? 'completed' : 'open'}">${a.status}</span>`}
                                    </div>
                                    <div class="text-secondary">Location: ${a.provider_location || 'N/A'} | Phone: ${a.provider_phone || 'N/A'}</div>
                                    <div class="text-secondary">Skills: ${a.skills || 'None listed'}</div>
                                    ${a.certificate_path ? `<div style="margin-top:0.25rem;"><a href="/E Jobs Go/${a.certificate_path}" target="_blank" style="font-weight:600; font-size:0.75rem;">📄 View Certificate</a></div>` : ''}
                                    <div style="margin-top:0.25rem;"><em>"${a.message || 'No cover letter provided.'}"</em></div>
                                </div>`).join('')}
                            </div>
                        </div>`;
                    } else {
                        appsHtml = `<p class="text-secondary" style="font-size:0.875rem; margin-top:1rem;">No applications yet.</p>`;
                    }
                } catch(e) {}

                html += `
                    <div class="card job-card">
                        <h4>${job.title} ${job.is_remote == 1 ? '<span class="badge badge-assigned" style="font-size:0.7rem; margin-left:0.5rem;">Remote</span>' : ''}</h4>
                        <div class="job-meta">
                            <span class="badge badge-${job.status}">${job.status}</span>
                            <span>${job.category || 'General'}</span>
                            <span>${job.budget ? '$'+job.budget : 'Negotiable'}</span>
                        </div>
                        <p class="text-secondary" style="flex:1;">${job.description}</p>
                        ${appsHtml}
                    </div>
                `;
            }
            html += `</div>`;
            contentArea.innerHTML = html;
            
        } catch (err) {
            contentArea.innerHTML = '<p class="text-secondary">Error loading jobs.</p>';
        }
    }

    async function loadAvailableJobs() {
        contentArea.innerHTML = '<h3>Available Jobs</h3><p>Loading...</p>';
        try {
            const res = await fetch(`${API_URL}/jobs.php`);
            const jobs = await res.json();
            
            if (jobs.length === 0) {
                contentArea.innerHTML = `
                    <h3>Available Jobs</h3>
                    <div class="card text-center mt-2">
                        <p class="text-secondary">No open jobs available right now. Check back later!</p>
                    </div>
                `;
                return;
            }

            let html = `<h3>Available Jobs</h3><div class="jobs-grid">`;
            jobs.forEach(job => {
                html += `
                    <div class="card job-card">
                        <h4>${job.title} ${job.is_remote == 1 ? '<span class="badge badge-assigned" style="font-size:0.7rem; margin-left:0.5rem;">Remote</span>' : ''}</h4>
                        <div class="job-meta">
                            <span>🏢 ${job.customer_name}</span>
                            <span>📁 ${job.category || 'General'}</span>
                            <span>💰 ${job.budget ? '$'+job.budget : 'Negotiable'}</span>
                        </div>
                        <p class="text-secondary" style="flex:1;">${job.description}</p>
                        <button class="btn btn-primary mt-2" onclick="applyForJob(${job.id})" style="width:100%;">Apply Now</button>
                    </div>
                `;
            });
            html += `</div>`;
            contentArea.innerHTML = html;
            
        } catch (err) {
            contentArea.innerHTML = '<p class="text-secondary">Error loading jobs.</p>';
        }
    }

    async function loadProviderApplications() {
        contentArea.innerHTML = '<h3>My Applications</h3><p>Loading...</p>';
        try {
            const res = await fetch(`${API_URL}/applications.php?provider_id=${user.id}`);
            const apps = await res.json();
            
            if (apps.length === 0) {
                contentArea.innerHTML = `
                    <h3>My Applications</h3>
                    <div class="card text-center mt-2">
                        <p class="text-secondary">You haven't applied to any jobs yet.</p>
                    </div>
                `;
                return;
            }

            let html = `<h3>My Applications</h3><div class="jobs-grid">`;
            apps.forEach(app => {
                let contactInfo = '';
                if (app.status === 'accepted') {
                    contactInfo = `
                        <div style="background:rgba(16, 185, 129, 0.1); padding:0.75rem; border-radius:0.5rem; margin-top:1rem; border: 1px solid var(--accent-secondary);">
                            <strong style="color:var(--accent-secondary);">🎉 You are hired!</strong><br>
                            <span style="font-size:0.875rem;"><strong>Location:</strong> ${app.customer_location || 'Remote/Not specified'}</span><br>
                            <span style="font-size:0.875rem;"><strong>Phone:</strong> ${app.customer_phone || 'Not specified'}</span>
                        </div>
                    `;
                }

                html += `
                    <div class="card job-card">
                        <h4>Job: ${app.job_title} ${app.is_remote == 1 ? '<span class="badge badge-assigned" style="font-size:0.7rem; margin-left:0.5rem;">Remote</span>' : ''}</h4>
                        <div class="job-meta mt-1">
                            <span class="badge ${app.status === 'pending' ? 'badge-open' : 'badge-completed'}">Status: ${app.status}</span>
                        </div>
                        <p class="text-secondary mt-1"><strong>Your Message:</strong><br>${app.message || 'No message provided.'}</p>
                        ${contactInfo}
                        <div class="text-secondary" style="font-size:0.75rem; margin-top:1rem;">Applied on: ${new Date(app.created_at).toLocaleDateString()}</div>
                    </div>
                `;
            });
            html += `</div>`;
            contentArea.innerHTML = html;
            
        } catch (err) {
            contentArea.innerHTML = '<p class="text-secondary">Error loading applications.</p>';
        }
    }

    function loadSettings() {
        let html = `
            <h3>Settings</h3>
            <div class="card" style="max-width: 600px; margin-top: 1rem;">
                <form id="settings-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="full_name" class="form-control" value="${user.full_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input type="text" name="phone" class="form-control" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Address / Location</label>
                        <input type="text" name="location" class="form-control" value="${user.location || ''}" required>
                    </div>
                    ${user.role === 'provider' ? `
                    <div class="form-group">
                        <label>Skills</label>
                        <input type="text" name="skills" class="form-control" value="${user.skills || ''}">
                    </div>
                    <div class="form-group">
                        <label>Update Certificate</label>
                        <input type="file" name="certificate" class="form-control" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                        ${user.certificate_path ? `<small class="text-secondary">Current: <a href="/E Jobs Go/${user.certificate_path}" target="_blank">View Certificate</a></small>` : ''}
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label>New Password (Optional)</label>
                        <input type="password" name="password" class="form-control" placeholder="Leave blank to keep current">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
            </div>
        `;
        contentArea.innerHTML = html;

        document.getElementById('settings-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Updating...';

            const formData = new FormData(e.target);

            try {
                const res = await fetch(`${API_URL}/auth.php?action=update`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (res.ok) {
                    showAlert('Profile updated successfully!', 'success');
                    // update local user
                    user = data.user;
                    localStorage.setItem('ejobs_user', JSON.stringify(user));
                    document.getElementById('user-name').textContent = user.full_name;
                    loadSettings(); // refresh form
                } else {
                    showAlert(data.message || 'Failed to update', 'error');
                }
            } catch (err) {
                showAlert('Network error.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Update Profile';
            }
        });
    }

    window.applyForJob = async function(jobId) {
        let message = "";
        
        // If user has a certificate, prompt is optional. If not, it's mandatory.
        if (user.certificate_path) {
            message = prompt("Since you have a certificate, explaining why you fit is optional. You can leave this blank:");
            if (message === null) return; // cancelled
        } else {
            message = prompt("Mandatory: Please write a short message detailing why you are a good fit for this job (since no certificate is uploaded):");
            if (message === null) return; // cancelled
            if (message.trim() === "") {
                showAlert("You must provide a reason why you fit since you don't have a certificate uploaded.", "error");
                return;
            }
        }

        try {
            const res = await fetch(`${API_URL}/applications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply', job_id: jobId, provider_id: user.id, message })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showAlert('Application submitted successfully!', 'success');
            } else {
                showAlert(data.message || 'Failed to apply.', 'error');
            }
        } catch (err) {
            showAlert('Network error.', 'error');
        }
    };

    window.acceptApplication = async function(appId, jobId) {
        if (!confirm("Are you sure you want to accept this provider? Other applications for this job will remain but the job will be marked as assigned.")) return;

        try {
            const res = await fetch(`${API_URL}/applications.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'accept', application_id: appId, job_id: jobId })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showAlert('Provider accepted! They can now see your contact info.', 'success');
                loadCustomerJobs(); // reload to reflect changes
            } else {
                showAlert(data.message || 'Failed to accept.', 'error');
            }
        } catch (err) {
            showAlert('Network error.', 'error');
        }
    };
});
