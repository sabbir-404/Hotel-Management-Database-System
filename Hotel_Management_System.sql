-- Hotel Management System Database
-- CSE-303 Relational Database Schema
CREATE DATABASE IF NOT EXISTS Hotel_Management_System;
USE Hotel_Management_System;

-- =========================================================
-- 1. HOTEL
-- =========================================================
CREATE TABLE Hotel (
    Hotel_ID INT AUTO_INCREMENT PRIMARY KEY,
    Hotel_Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255),
    City VARCHAR(100),
    Contact_Number VARCHAR(20),
    Star_Rating TINYINT CHECK (Star_Rating BETWEEN 1 AND 5)
);

-- =========================================================
-- 2. GUEST
-- =========================================================
CREATE TABLE Guest (
    Guest_ID INT AUTO_INCREMENT PRIMARY KEY,
    Full_Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255),
    Nationality VARCHAR(50),
    Identification_Number VARCHAR(50) NOT NULL UNIQUE
);

-- =========================================================
-- 3. EMPLOYEE
-- =========================================================
CREATE TABLE Employee (
    Employee_ID INT AUTO_INCREMENT PRIMARY KEY,
    Hotel_ID INT NOT NULL,
    Full_Name VARCHAR(100) NOT NULL,
    Designation VARCHAR(50),
    Salary DECIMAL(10,2),
    Joining_Date DATE,
    Employment_Status VARCHAR(20) DEFAULT 'Active' CHECK (Employment_Status IN ('Active', 'Inactive', 'On Leave')),
    Password VARCHAR(255),
    CONSTRAINT fk_employee_hotel FOREIGN KEY (Hotel_ID) REFERENCES Hotel(Hotel_ID)
);

-- =========================================================
-- 4. ROOM
-- =========================================================
CREATE TABLE Room (
    Room_ID INT AUTO_INCREMENT PRIMARY KEY,
    Hotel_ID INT NOT NULL,
    Room_Number VARCHAR(20) NOT NULL,
    Room_Type VARCHAR(30) NOT NULL CHECK (Room_Type IN ('Single', 'Double', 'Suite', 'Deluxe')),
    Floor_Number INT,
    Capacity INT CHECK (Capacity > 0),
    Nightly_Rate DECIMAL(10,2) CHECK (Nightly_Rate >= 0),
    Availability_Status VARCHAR(20) DEFAULT 'Available' CHECK (Availability_Status IN ('Available', 'Reserved', 'Occupied', 'Maintenance')),
    UNIQUE (Hotel_ID, Room_Number),
    CONSTRAINT fk_room_hotel FOREIGN KEY (Hotel_ID) REFERENCES Hotel(Hotel_ID)
);

-- =========================================================
-- 5. RESERVATION
-- =========================================================
CREATE TABLE Reservation (
    Reservation_ID INT AUTO_INCREMENT PRIMARY KEY,
    Guest_ID INT NOT NULL,
    Room_ID INT NOT NULL,
    Booking_Date DATE NOT NULL,
    Check_In_Date DATE NOT NULL,
    Check_Out_Date DATE NOT NULL,
    Reservation_Status VARCHAR(20) DEFAULT 'Pending' CHECK (Reservation_Status IN ('Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled')),
    Number_of_Guests INT NOT NULL CHECK (Number_of_Guests > 0),
    CHECK (Check_Out_Date > Check_In_Date),
    CONSTRAINT fk_reservation_guest FOREIGN KEY (Guest_ID) REFERENCES Guest(Guest_ID),
    CONSTRAINT fk_reservation_room FOREIGN KEY (Room_ID) REFERENCES Room(Room_ID)
);

-- =========================================================
-- 6. SERVICE
-- =========================================================
CREATE TABLE Service (
    Service_ID INT AUTO_INCREMENT PRIMARY KEY,
    Service_Type VARCHAR(50) NOT NULL UNIQUE
);

-- =========================================================
-- 7. BILL (1:1 with Reservation)
-- =========================================================
CREATE TABLE Bill (
    Bill_ID INT AUTO_INCREMENT PRIMARY KEY,
    Reservation_ID INT NOT NULL UNIQUE,
    Total_Amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Total_Amount >= 0),
    Taxes DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Taxes >= 0),
    Discounts DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Discounts >= 0),
    Payment_Method VARCHAR(30) CHECK (Payment_Method IS NULL OR Payment_Method IN ('Cash', 'Card', 'Mobile Banking', 'Bank Transfer')),
    Payment_Status VARCHAR(20) DEFAULT 'Pending' CHECK (Payment_Status IN ('Pending', 'Paid', 'Cancelled')),
    CONSTRAINT fk_bill_reservation FOREIGN KEY (Reservation_ID) REFERENCES Reservation(Reservation_ID)
);

-- =========================================================
-- 8. SERVICE_RECORD (Associative Entity between Guest and Service)
-- =========================================================
CREATE TABLE Service_Record (
    Service_Record_ID INT AUTO_INCREMENT PRIMARY KEY,
    Guest_ID INT NOT NULL,
    Service_ID INT NOT NULL,
    Bill_ID INT,
    Service_Date DATE NOT NULL,
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    Charge DECIMAL(10,2) NOT NULL CHECK (Charge >= 0),
    CONSTRAINT fk_service_record_guest FOREIGN KEY (Guest_ID) REFERENCES Guest(Guest_ID),
    CONSTRAINT fk_service_record_service FOREIGN KEY (Service_ID) REFERENCES Service(Service_ID),
    CONSTRAINT fk_service_record_bill FOREIGN KEY (Bill_ID) REFERENCES Bill(Bill_ID)
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_room_hotel ON Room(Hotel_ID);
CREATE INDEX idx_employee_hotel ON Employee(Hotel_ID);
CREATE INDEX idx_reservation_guest ON Reservation(Guest_ID);
CREATE INDEX idx_reservation_room ON Reservation(Room_ID);
CREATE INDEX idx_service_record_guest ON Service_Record(Guest_ID);
CREATE INDEX idx_service_record_service ON Service_Record(Service_ID);
CREATE INDEX idx_service_record_bill ON Service_Record(Bill_ID);

-- =========================================================
-- AVAILABLE ROOMS VIEW
-- =========================================================
CREATE VIEW Available_Rooms AS
SELECT Room_ID, Hotel_ID, Room_Number, Room_Type, Floor_Number, Capacity, Nightly_Rate
FROM Room
WHERE Availability_Status = 'Available';
