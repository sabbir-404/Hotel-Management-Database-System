# Hotel.com - Full-Stack Hotel Management & Guest Reservation System (Bangladesh Edition)

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20Express%20%7C%20MySQL-blue)](https://github.com/)
[![Currency](https://img.shields.io/badge/Currency-BDT%20(%E0%A7%B3)-emerald)](#)
[![License](https://img.shields.io/badge/License-MIT-orange)](#)

A full-stack web application designed for hotel chains in Bangladesh. **Hotel.com** features a dual-interface architecture: an elegant consumer-facing **Hotel Booking Portal** for guests and a high-contrast **Staff Admin Operations Panel** for hotel administrators, managers, and receptionists.

---

## ✨ Features Highlight

### 🏨 1. Consumer Guest Booking Portal
- **Booking.com Style Browsing**: Browse luxury hotels across **Dhaka**, **Cox's Bazar**, and **Sylhet** with real-time BDT (৳) pricing.
- **Real Database Room Pricing & Descriptions**: Displays regular prices crossed out with active discounted sale rates (e.g. ~~BDT 8,000~~ **BDT 6,500**) alongside detailed room amenities directly from MySQL.
- **Guest Self-Registration**: Seamless signup flow for new customers with Full Name, Phone Number, Email, Address, Nationality, and National ID / Passport Number.
- **Dedicated Customer Guest Login (`/guest-login`)**: Sign in securely using Phone Number & NID / Passport Number.
- **Customer Dashboard (`/my-bookings`)**: 
  - View all active and past hotel reservations.
  - **Update Booking**: Modify stay dates (*Check-In* & *Check-Out*) or guest count with automatic price recalculation.
  - **Cancel Booking**: Request cancellation, which automatically updates room status back to `Available` in MySQL.

### 🛡️ 2. Staff Admin Operations Control Panel
- **Separate Staff Portal Sign-In (`/login`)**: Role-based access control for `Admin`, `Manager`, and `Receptionist`.
- **Admin Control Sidebar**: Operations Center, Guest Directory, 6-Step Booking Wizard, Express Check-In, Express Check-Out, Reservation Ledger, Service Desk, Billing & Invoices, Employee Management, and System Reports.
- **Hotel Branch Management (`/hotels`)**: Create, edit, or delete hotel branches, specify Star Ratings (1-5), and update custom Hotel Picture URLs.
- **Room Inventory Control (`/rooms`)**: Manage room numbers, floor numbers, guest capacity, regular nightly rates, sale rates, and room descriptions.

### 🗄️ 3. Relational MySQL Database Engine
- **Relational Schema**: `Person`, `Guest`, `Employee`, `Hotel`, `Room`, `Reservation`, `Service`, `Service_Record`, `Bill`, `Bill_Item`, `Reservation_Log`.
- **MySQL Triggers**:
  - `trg_check_room`: Prevents booking occupied or reserved rooms.
  - `trg_room_reserved`: Automatically updates room status to `Reserved` upon booking.
  - `trg_bill_total`: Automatically calculates final bill amounts considering taxes and discounts.
  - `trg_reservation_backup`: Backs up deleted reservations to `Reservation_Log` automatically.
- **Database Views**: `Available_Rooms` view for instant inventory lookups.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Phosphor Icons, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication, Dotenv |
| **Database** | MySQL / MariaDB (via `mysql2` connection pool) |
| **Tooling** | Concurrently, Vite HMR, TypeScript Compiler (`tsc`) |

---

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed on your system:

1. **Node.js**: `v16.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: `v8.0.0` or higher (comes bundled with Node.js)
3. **MySQL / MariaDB**: MySQL Server running on `localhost:3306` (e.g. via **XAMPP**, **WampServer**, or standalone MySQL Server)

---

## 🚀 Quick Start Guide

Follow these step-by-step instructions to get the project up and running locally:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Hotel-Management-Database-System.git
cd Hotel-Management-Database-System
```

### 2. Install Project Dependencies
Run the install command from the **root directory** to install dependencies for the root, backend server, and frontend client:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```bash
# Path: server/.env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=Hotel_Management_System
JWT_SECRET=hotel_management_system_super_secret_jwt_key_2026
```
*(Note: If your MySQL `root` user has a password, enter it in `DB_PASSWORD`)*

### 4. Initialize Database & Seed Sample Data
Ensure MySQL service is running in XAMPP or MySQL Server, then run:
```bash
npm run db:init
```
This command automatically:
- Creates the `Hotel_Management_System` database.
- Recovers any orphan InnoDB tablespaces.
- Executes the relational SQL DDL schema & triggers from `Hotel_Management_System.sql`.
- Seeds fresh sample Bangladesh dataset (Hotels in Dhaka, Cox's Bazar, Sylhet, Rooms, Guests, and Staff).

### 5. Start Development Server
Run the concurrent dev command from the **root directory**:
```bash
npm run dev
```
This launches:
- 🟢 **Backend API Server**: `http://localhost:5000`
- 🔵 **Frontend Client (Vite)**: `http://localhost:3000`

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🔑 Demo Login Credentials

### 👤 Customer Guest Account
- **Access Route**: `/guest-login`
- **Phone Number / Email**: `+8801700112233`
- **NID / Passport**: `NID-1994829102938`

### 🛡️ Staff Admin Accounts
- **Access Route**: `/login`
- **Admin**: Username: `admin` | Password: `password` (Full System Control)
- **Receptionist**: Username: `receptionist` | Password: `password` (Bookings & Check-In/Out)
- **Manager**: Username: `manager` | Password: `password` (Reports & Audits)

---

## 📂 Repository Directory Structure

```
Hotel-Management-Database-System/
├── client/                      # React + TypeScript Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, Footer, SkeletonLoader, Layout
│   │   ├── context/            # AuthContext (JWT & Session state)
│   │   ├── pages/              # HomePage, HotelsPage, RoomsPage, RegisterPage,
│   │   │                       # GuestLoginPage, MyBookingsPage, DashboardPage, etc.
│   │   ├── services/           # Axios API Interceptors
│   │   └── types/              # TypeScript Interfaces (Hotel, Room, Guest, etc.)
│   └── vite.config.ts          # Vite Configuration & Backend API Proxy
│
├── server/                      # Node.js + Express Backend Server
│   ├── config/                 # db.js (MySQL2 Connection Pool)
│   ├── controllers/            # hotelController, roomController, guestController, etc.
│   ├── middleware/             # auth.js (JWT Verification & Role Guard)
│   ├── routes/                 # Express API Endpoints (/api/hotels, /api/rooms, etc.)
│   └── scripts/                # initDb.js (Database Initializer & Seeder)
│
├── Hotel_Management_System.sql  # MySQL DDL Schema, Triggers, Views & Indexes
├── package.json                 # Root Scripts for Concurrent Execution
├── .gitignore                   # Git Ignore File
└── README.md                    # Project Documentation
```

---

## 📜 Available NPM Scripts

From the root project directory:
- `npm run dev`: Runs server and client concurrently in development mode.
- `npm run db:init`: Cleans, initializes, and seeds the MySQL database.
- `npm run build`: Compiles TypeScript and builds the production frontend bundle.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
