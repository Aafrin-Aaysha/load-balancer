# 📚 College Result Portal

A full-stack College Result Management System with a **custom Python load balancer**, **5 backend service instances**, and a **React (Vite) + Tailwind + shadcn UI** frontend. Built for scalability, academic demo purposes, and real-world deployment capability.

---

## 🚀 Features

* ✅ Custom Python-based Load Balancer (no nginx / no docker)
* ✅ 5 backend instances for high availability
* ✅ MongoDB database with flexible course schema
* ✅ Student result lookup by Roll Number / Enrollment Number
* ✅ Subject-wise marks, SGPA, and Pass/Fail calculation
* ✅ Multiple departments/courses supported (MCA, BCA, BSc CS, BSc Maths, MSc CS, etc.)
* ✅ Admin Login (Hardcoded) via Modal
* ✅ Admin CSV Upload page
* ✅ Fully responsive UI (mobile + desktop)
* ✅ Built with React (Vite) + Tailwind + shadcn/ui

---

## 🏗️ Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Frontend      | React (Vite) + Tailwind + shadcn/ui |
| Backend       | Python (FastAPI/Flask)              |
| Database      | MongoDB                             |
| Load Balancer | Custom Python script                |
| Routing       | React Router                        |

---

## 📂 Project Structure (High-Level)

```
root/
│
├── frontend/              # React (Vite) UI
├── backend/               # All Python backend code lives here
│   ├── app.py             # Backend server entry (run 5 instances with different ports)
│   ├── loadbalancer.py    # 👈 Custom Python load balancer (same folder)
│   ├── models.py          # Pydantic/DB models
│   ├── database.py        # MongoDB connection helpers
│   ├── requirements.txt   # Python dependencies
│   ├── start_backends.*   # Convenience script (.bat/.sh)
│   └── __pycache__/       # Python cache (ignored)
├── sample_results.csv     # Sample CSV dataset
└── README.md              # This file
```

---

## 🔁 Architecture Overview

```
          ┌──────────────────────────┐
          │        Frontend          │
          │  (React + Vite + shadcn) │
          └────────────┬─────────────┘
                       │  HTTP
                       ▼
           backend/loadbalancer.py
              (Round‑robin + HC)
              ┌───────┬───────┬───────┬───────┬───────┐
              ▼       ▼       ▼       ▼       ▼
           app.py  app.py  app.py  app.py  app.py
           :5001   :5002   :5003   :5004   :5005
                     │        │        │
                     └────────┴────────┴──▶ MongoDB
```

---

## 🔁 Architecture Overview

```
          ┌──────────────────────────┐
          │        Frontend          │
          │  (React + Vite + shadcn) │
          └────────────┬─────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Load Balancer  │
              │  (Python Script)│
              └───────┬─────────┘
     ┌────────┬───────┼───────┬────────┐
     ▼        ▼       ▼       ▼        ▼
 backend1  backend2 backend3 backend4 backend5
 (5001)    (5002)   (5003)   (5004)   (5005)
     └────────┬───────────┬────────────┘
              ▼           ▼
                 MongoDB
```

---

## 🧑‍💻 Running Locally

### 1️⃣ Start MongoDB

Ensure MongoDB is running locally (default `mongodb://localhost:27017`).

### 2️⃣ Install backend deps

```
cd backend
pip install -r requirements.txt
```

### 3️⃣ Start **five** backend instances (same code, different ports)

> Use either the helper script if you have it, or run manually.

**Windows (PowerShell / CMD):**

```
python app.py --port 5001
python app.py --port 5002
python app.py --port 5003
python app.py --port 5004
python app.py --port 5005
```

**Linux/macOS (zsh/bash):**

```
python3 app.py --port 5001 &
python3 app.py --port 5002 &
python3 app.py --port 5003 &
python3 app.py --port 5004 &
python3 app.py --port 5005 &
```

### 4️⃣ Start the **Python Load Balancer** (in the same backend folder)

```
python loadbalancer.py --port 8000
```

### 5️⃣ Run the Frontend

```
cd ../frontend
npm install
npm run dev
```

Access frontend at: `http://localhost:5173`
Frontend communicates with load balancer at: `http://localhost:8000`

---

## 🌐 Deployment

This repository currently supports **frontend-only** hosting via Netlify.
Backend can be self-hosted or later deployed on VPS/cloud.

---

## 📥 CSV Upload Format

```
name,roll_number,course,semester,year,subject_name,max_marks,obtained_marks
John Doe,MCA101,MCA,1,2025,Data Structures,100,85
...
```

---

## 🔒 Admin Login (Hardcoded)

| Username | Password |
| -------- | -------- |
| admin    | admin123 |

---

## ✅ Future Enhancements

* ✅ JWT-based secure authentication
* ✅ Cloud deployment guide for backend
* ✅ PM2 or systemd service for backend resilience
* ✅ Docker version
* ✅ Role-based admin panel

---

## 📜 License

This project is intended for educational and academic demonstration purposes.

---

## ✨ Credits

Developed as a scalable college result management system with custom infrastructure logic.

---

## 🗂️ .gitignore for this project

```
# Node / React
/node_modules
/frontend/node_modules
/frontend/dist

# Python virtual envs
venv/
.env/
*.pyc
__pycache__/

# Vite build output
/frontend/.vite

# Local config
*.env
*.log
*.sqlite

# OS
.DS_Store
Thumbs.db
```
