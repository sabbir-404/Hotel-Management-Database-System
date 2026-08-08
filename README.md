# Hotel.com - Full-Stack Hotel Management & Guest Reservation System (Bangladesh Edition)

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20Express%20%7C%20MySQL-blue)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-orange)](#)
[![CSE-303 Database Project](https://img.shields.io/badge/CSE--303-Relational%20Database%20Project-green)](#)

A full-stack web application designed for hotel chains in Bangladesh. **Hotel.com** features a dual-interface architecture: an elegant consumer-facing **Guest Portal** for customers and a high-contrast **Staff Operations Control Panel** for hotel administrators, managers, and receptionists.

---

## 🗺️ Website Pages Overview

The application features **20 dedicated pages** categorized into Public Customer Pages, Dedicated Customer Portal Pages, and Staff Operations Control Panel Pages:

### 🌐 1. Public & Customer-Facing Pages

| Page Path | Component | Description & Key Features |
| :--- | :--- | :--- |
| **`/`** | [`HomePage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/HomePage.tsx) | **Landing & Search Portal**: Hero banner with destination selector (Dhaka, Cox's Bazar, Sylhet, Chittagong, Rangamati, Sreemangal), check-in date picker, featured hotel carousel, customer reviews, and hotel amenity highlights. |
| **`/register`** | [`RegisterPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/RegisterPage.tsx) | **Guest Self-Registration**: Customer signup form requiring Full Name, Username, Password (with live match validation), Phone Number, Email, Address, Nationality, and NID / Passport Number. Automatically logs in newly registered guests and routes to `/guest-dashboard`. |
| **`/guest-login`** | [`GuestLoginPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/GuestLoginPage.tsx) | **Customer Sign-In**: Dedicated guest portal sign-in page supporting authentication via Email / Username / Phone Number and Password or Identification Number. |
| **`/login`** | [`LoginPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/LoginPage.tsx) | **Staff Portal Sign-In**: Operations login page for hotel staff (`Admin`, `Manager`, `Receptionist`) with quick one-click demo credentials. |
| **`/hotels`** | [`HotelsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/HotelsPage.tsx) | **Hotel Branch Directory**: Explore hotel branches across Bangladesh with city filters, star rating badges, image cards, and direct room booking triggers (`GuestBookingModal` for guests or 6-Step Admin Wizard for staff). |
| **`/rooms`** | [`RoomsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/RoomsPage.tsx) | **Room Showcase & Inventory**: View available rooms with regular nightly rates, crossed-out discounted sale rates (BDT ৳), capacity badges, availability status indicators (`Available`, `Reserved`, `Occupied`, `Maintenance`), and admin room creation modal. |

---

### 👤 2. Dedicated Customer Portal Pages

| Page Path | Component | Description & Key Features |
| :--- | :--- | :--- |
| **`/guest-dashboard`** | [`GuestDashboardPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/GuestDashboardPage.tsx) | **My Guest Portal & Dashboard**: Dedicated customer control panel featuring a personalized welcome banner, 4 summary metric cards (Active Stays, Completed Stays, Total BDT Spent, Outstanding Bills), stay schedule manager, in-stay service request desk, and profile summary card. |
| **`/my-bookings`** | [`MyBookingsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/MyBookingsPage.tsx) | **My Bookings Ledger**: Customer reservation history listing active, confirmed, and past stays with stay date modification, price breakdown, and booking cancellation controls. |

---

### 🛡️ 3. Staff Operations & Admin Panel Pages

| Page Path | Component | Description & Key Features |
| :--- | :--- | :--- |
| **`/dashboard`** | [`DashboardPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/DashboardPage.tsx) | **Operations Control Dashboard**: Real-time staff analytics dashboard displaying Total Hotels, Available Rooms, Occupied Rooms, Active Reservations, Today's & Monthly Revenue (BDT ৳), Occupancy Rate %, revenue trend charts, and room type distribution charts. |
| **`/guests`** | [`GuestsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/GuestsPage.tsx) | **Guest Directory**: Master guest management list with instant multi-attribute search (Guest ID, Full Name, Phone, Email, NID), guest registration modal, edit modal, and guest profile launcher. |
| **`/guests/profile/:id`** | [`GuestProfilePage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/GuestProfilePage.tsx) | **360° Guest Profile Summary**: Comprehensive guest profile displaying lifetime stay history, ordered room services, billing totals, and guest identification details. |
| **`/reservations`** | [`ReservationsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/ReservationsPage.tsx) | **Master Reservation Ledger**: Filterable table of all reservations by status (`Pending`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`), reservation details viewer, and status updater. |
| **`/reservations/new`** | [`BookingWizardPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/BookingWizardPage.tsx) | **6-Step Staff Booking Wizard**: Guided step-by-step room reservation wizard for front desk staff: Step 1 (Guest Selection/Creation) → Step 2 (Hotel Selection) → Step 3 (Dates & Guests) → Step 4 (Room Selection) → Step 5 (Services Selection) → Step 6 (Review & Confirmation). |
| **`/reservations/check-in`** | [`CheckInPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/CheckInPage.tsx) | **Express Check-In Desk**: Front desk check-in manager for today's arriving guests. One-click check-in updates reservation status to `Checked In` and room status to `Occupied`. |
| **`/reservations/check-out`** | [`CheckOutPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/CheckOutPage.tsx) | **Express Check-Out Desk**: Departure manager for checking out guests, automatically generating the final BDT bill and returning room status to `Available`. |
| **`/services`** | [`ServicesPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/ServicesPage.tsx) | **Hotel Service Desk**: Catalog of hotel services (Express Laundry, Luxury Spa, Airport Transfer, Gourmet Room Service) with price management and a service assignment modal for ordering services to active guest stays. |
| **`/billing`** | [`BillingPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/BillingPage.tsx) | **Billing & Invoices**: Master billing ledger displaying invoice numbers, room charges, service charges, taxes, discounts, final BDT totals, payment status (`Paid`, `Pending`, `Cancelled`), and printable invoice view. |
| **`/employees`** | [`EmployeesPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/EmployeesPage.tsx) | **Employee HR Management**: Staff directory for managing hotel personnel across branches with designation, salary (BDT ৳), joining date, employment status (`Active`, `Inactive`, `On Leave`), and add/edit employee modals. |
| **`/reports`** | [`ReportsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/ReportsPage.tsx) | **System Analytics & Reports**: Tabbed report suite providing data insights on Highest-Spending Guests, Upcoming Check-Ins, Hotel Occupancy %, and Employee Salary Expenses. |
| **`/settings`** | [`SettingsPage.tsx`](file:///f:/Repository/Hotel-Management-Database-System/client/src/pages/SettingsPage.tsx) | **System Settings**: Configuration page for tax rates, default currency (BDT ৳), stay policies, notification preferences, and database connectivity health status. |

---

## 🗄️ Relational Database Architecture (CSE-303 ERD Standard)

The database schema strictly adheres to the **CSE-303 Relational Database ERD Specification** with 8 core tables:

```text
HOTEL ──────────────1:N────────────── ROOM
  │                                     │
  │ 1:N                                 │ 1:N
  ▼                                     ▼
EMPLOYEE                            RESERVATION
                                    │         │
                                 1:N│         │ 1:1 (UNIQUE)
                                    ▼         ▼
                                  GUEST      BILL
                                    │         │
                                 1:N│         │ 1:N
                                    ▼         ▼
                                  SERVICE_RECORD
                                        ▲
                                     N:1│
                                        SERVICE
```

### Core Schema Tables:
1. **`Hotel`**: `Hotel_ID` (PK), `Hotel_Name`, `Address`, `City`, `Contact_Number`, `Star_Rating`.
2. **`Guest`**: `Guest_ID` (PK AUTO_INCREMENT), `Full_Name`, `Phone_Number`, `Email`, `Address`, `Nationality`, `Identification_Number`, `Username`, `Password`.
3. **`Employee`**: `Employee_ID` (PK AUTO_INCREMENT), `Hotel_ID` (FK), `Full_Name`, `Designation`, `Salary`, `Joining_Date`, `Employment_Status`.
4. **`Room`**: `Room_ID` (PK AUTO_INCREMENT), `Hotel_ID` (FK), `Room_Number`, `Room_Type`, `Floor_Number`, `Capacity`, `Nightly_Rate`, `Availability_Status`.
5. **`Reservation`**: `Reservation_ID` (PK AUTO_INCREMENT), `Guest_ID` (FK), `Room_ID` (FK), `Booking_Date`, `Check_In_Date`, `Check_Out_Date`, `Reservation_Status`, `Number_of_Guests`.
6. **`Service`**: `Service_ID` (PK AUTO_INCREMENT), `Service_Type`.
7. **`Bill`**: `Bill_ID` (PK AUTO_INCREMENT), `Reservation_ID` (FK UNIQUE), `Total_Amount`, `Taxes`, `Discounts`, `Payment_Method`, `Payment_Status`.
8. **`Service_Record`**: `Service_Record_ID` (PK AUTO_INCREMENT), `Guest_ID` (FK), `Service_ID` (FK), `Bill_ID` (FK), `Service_Date`, `Quantity`, `Charge`.

- **Database Views**: `Available_Rooms` view for instant available room lookups.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Phosphor Icons, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication, Dotenv |
| **Database** | MySQL / MariaDB (via `mysql2` connection pool) |
| **Tooling** | Concurrently, Vite HMR, TypeScript Compiler (`tsc`) |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Hotel-Management-Database-System.git
cd Hotel-Management-Database-System
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
# Path: server/.env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=Hotel_Management_System
JWT_SECRET=hotel_management_system_super_secret_jwt_key_2026
```

### 4. Initialize Database & Seed Sample Data
Ensure MySQL service is running in XAMPP or MySQL Server, then run:
```bash
npm run db:init
```

### 5. Start Development Server
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🔑 Demo Login Credentials

### 👤 Customer Guest Account
- **Access Route**: `/guest-login`
- **Username / Phone / Email**: `tanvir` or `+8801700112233`
- **Password**: `password`

### 🛡️ Staff Admin Accounts
- **Access Route**: `/login`
- **Admin**: Username: `admin` | Password: `password` (Full System Control)
- **Receptionist**: Username: `receptionist` | Password: `password` (Bookings & Check-In/Out)
- **Manager**: Username: `manager` | Password: `password` (Reports & Audits)

---

## 📜 Available NPM Scripts

From the root project directory:
- `npm run dev`: Runs backend server and client concurrently in development mode.
- `npm run db:init`: Cleans, initializes, and seeds the MySQL database according to CSE-303 ERD standard.
- `npm run build`: Compiles TypeScript and builds the production frontend bundle.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
