# Installation Guide - AmaBakeryPos 🛠️

This document provides a comprehensive guide on how to set up and run the **AmaBakeryPos** project on your local machine.

---

## 🏗️ Prerequisites

Before you begin, ensure you have the following tools installed on your system:

### 1. System Tools
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.8 or higher
- **pip**: Python package installer
- **Git**: For cloning the repository
- **Redis Server**: Required for real-time features (WebSockets)
- **LSOF**: Used by the management scripts to manage ports

### 2. Database
- **SQLite** (Default for development)
- **PostgreSQL** (Optional, recommended for production)

---

## 🚀 Quick Setup (Recommended)

The project includes an automation script that handles the creation of utility scripts, environment setup, and dependency installation.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Acrsahil/AmaBakeryPos
cd AmaBakeryPos
```

### Step 2: Run the Installer
Run the `install.sh` script to set up the development environment.
```bash
chmod +x install.sh
./install.sh
```
*This will create `start.sh` and `reset.sh` in the root directory.*

### Step 3: Initialize the Project
Use the generated `reset.sh` to install dependencies, run migrations, and start the servers for the first time.
```bash
./reset.sh
```
*Choose option `3` (Both) when prompted to set up both Frontend and Backend.*

---

## 🛠️ Manual Installation

If you prefer to set up the components manually, follow these steps:

### 1. Backend Setup (Django)
```bash
cd Backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt

cd mysite
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Management Scripts

After installation, use these scripts to manage the project efficiently:

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start All** | `./start.sh` | Starts both Django and Vite servers. |
| **Start Specific** | `./start.sh dj` / `./start.sh node` | Starts only the Backend or Frontend. |
| **Reset** | `./reset.sh` | Cleans the environment, reinstalls, and restarts. |
| **Stop All** | `./start.sh kill` | Stops all running project processes. |
| **Kill Ports** | `./start.sh kill ports` | Forcefully kills processes on default ports (8000, 8080, etc). |

---

## 🌐 Default Access Points

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Django Admin**: [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)
- **Default Credentials**: 
  - **Username**: `su`
  - **Password**: `su`

---

## 🐞 Troubleshooting

1. **Redis Errors**: Ensure Redis is running (`sudo systemctl start redis`).
2. **Port Conflicts**: If port 8000 or 8080 is in use, run `./start.sh kill ports`.
3. **Module Not Found**: Ensure you are in the correct virtual environment for the backend (`source Backend/env/bin/activate`).
