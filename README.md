#  E-Jobs Go

E-Jobs Go is a digital job marketplace designed to reduce youth unemployment in Zimbabwe by connecting skilled service providers (such as tutors, mechanics, delivery personnel, and repair technicians) with customers who need their services.

---

##  Key Features

* **Multi-Role User System** — Separate dashboards for service providers and employers
* **Secure Authentication** — User registration and login with password hashing (`bcrypt`)
* **Profile Management** — Users can update profiles and upload certificates for verification
* **Job Management** — Employers can create, edit, and manage job listings
* **Application System** — Job seekers can browse and apply for available jobs

---

##  Tech Stack

### Frontend

* HTML5 & CSS3 (Responsive UI)
* Vanilla JavaScript
* Fetch API (AJAX communication)

### Backend

* PHP 8+ (REST-like API structure)
* MySQL (Database)
* PDO (Secure database queries)

---

##  Project Structure

```
E-Jobs-Go/
├── assets/             # CSS, JavaScript, images
├── backend/
│   ├── api/            # Authentication, jobs, applications endpoints
│   ├── config/         # Database connection
│   └── uploads/        # User certificates & files
├── database/           # SQL schema
├── migrate.php         # Database setup script
├── index.html          # Landing page
├── login.html          # Login page
├── register.html       # Registration page
└── dashboard.html      # User dashboard
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shepherdmakasa06/E-Jobs-Go.git
```

### 2. Setup database

* Import SQL file from `/database`
* Configure database credentials in `/backend/config/database.php`

### 3. Run the project

* Use XAMPP / WAMP / Laragon
* Start Apache & MySQL
* Open `localhost/E-Jobs-Go`

---

## Future Improvements

* Add payment integration
* Real-time chat between users
* Mobile application (Android/iOS)
* Email notifications system
* Admin analytics dashboard

---

## Author

Shepherd Makasa
Aspiring Software Engineer | Web Developer

---

##  Support

If you like this project, consider giving it a star ⭐
