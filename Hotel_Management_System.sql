-- Hotel Management System Database
CREATE DATABASE IF NOT EXISTS Hotel_Management_System;
USE Hotel_Management_System;

CREATE TABLE Person(
 Person_ID INT AUTO_INCREMENT PRIMARY KEY,
 First_Name VARCHAR(50) NOT NULL,
 Last_Name VARCHAR(50) NOT NULL,
 Phone_Number VARCHAR(20) UNIQUE NOT NULL,
 Email VARCHAR(100) UNIQUE,
 Address VARCHAR(255),
 Nationality VARCHAR(50)
);

CREATE TABLE Hotel(
 Hotel_ID INT AUTO_INCREMENT PRIMARY KEY,
 Hotel_Name VARCHAR(100) NOT NULL,
 Address VARCHAR(255),
 City VARCHAR(100),
 Contact_Number VARCHAR(20),
 Star_Rating TINYINT CHECK (Star_Rating BETWEEN 1 AND 5)
);

CREATE TABLE Guest(
 Guest_ID INT PRIMARY KEY,
 Registration_Date DATE NOT NULL,
 Identification_Number VARCHAR(50) UNIQUE NOT NULL,
 CONSTRAINT fk_guest_person FOREIGN KEY(Guest_ID)
 REFERENCES Person(Person_ID) ON DELETE CASCADE
);

CREATE TABLE Employee(
 Employee_ID INT PRIMARY KEY,
 Hotel_ID INT NOT NULL,
 Designation VARCHAR(50),
 Salary DECIMAL(10,2),
 Joining_Date DATE,
 Employment_Status ENUM('Active','Inactive','On Leave') DEFAULT 'Active',
 CONSTRAINT fk_emp_person FOREIGN KEY(Employee_ID)
 REFERENCES Person(Person_ID) ON DELETE CASCADE,
 CONSTRAINT fk_emp_hotel FOREIGN KEY(Hotel_ID)
 REFERENCES Hotel(Hotel_ID)
);

CREATE TABLE Room(
 Room_ID INT AUTO_INCREMENT PRIMARY KEY,
 Hotel_ID INT NOT NULL,
 Room_Number VARCHAR(20) NOT NULL,
 Room_Type ENUM('Single','Double','Suite','Deluxe') NOT NULL,
 Floor_Number INT,
 Capacity INT,
 Nightly_Rate DECIMAL(10,2),
 Availability_Status ENUM('Available','Reserved','Occupied','Maintenance') DEFAULT 'Available',
 UNIQUE(Hotel_ID,Room_Number),
 FOREIGN KEY(Hotel_ID) REFERENCES Hotel(Hotel_ID)
);

CREATE TABLE Reservation(
 Reservation_ID INT AUTO_INCREMENT PRIMARY KEY,
 Guest_ID INT NOT NULL,
 Room_ID INT NOT NULL,
 Booking_Date DATE NOT NULL,
 Check_In_Date DATE NOT NULL,
 Check_Out_Date DATE NOT NULL,
 Reservation_Status ENUM('Pending','Confirmed','Checked In','Checked Out','Cancelled') DEFAULT 'Pending',
 Number_of_Guests INT,
 FOREIGN KEY(Guest_ID) REFERENCES Guest(Guest_ID),
 FOREIGN KEY(Room_ID) REFERENCES Room(Room_ID)
);

CREATE TABLE Service(
 Service_ID INT AUTO_INCREMENT PRIMARY KEY,
 Service_Name VARCHAR(100) NOT NULL,
 Service_Charge DECIMAL(10,2) NOT NULL,
 Service_Description TEXT
);

CREATE TABLE Service_Record(
 Service_Record_ID INT AUTO_INCREMENT PRIMARY KEY,
 Guest_ID INT NOT NULL,
 Service_ID INT NOT NULL,
 Service_Date DATE,
 Quantity INT DEFAULT 1,
 Charge DECIMAL(10,2),
 FOREIGN KEY(Guest_ID) REFERENCES Guest(Guest_ID),
 FOREIGN KEY(Service_ID) REFERENCES Service(Service_ID)
);

CREATE TABLE Bill(
 Bill_ID INT AUTO_INCREMENT PRIMARY KEY,
 Reservation_ID INT UNIQUE NOT NULL,
 Billing_Date DATE DEFAULT (CURRENT_DATE),
 Total_Amount DECIMAL(10,2) DEFAULT 0,
 Taxes DECIMAL(10,2) DEFAULT 0,
 Discounts DECIMAL(10,2) DEFAULT 0,
 Final_Amount DECIMAL(10,2) DEFAULT 0,
 Payment_Method ENUM('Cash','Card','Mobile Banking','Bank Transfer'),
 Payment_Status ENUM('Pending','Paid','Cancelled') DEFAULT 'Pending',
 FOREIGN KEY(Reservation_ID) REFERENCES Reservation(Reservation_ID)
);

CREATE TABLE Bill_Item(
 Bill_ID INT,
 Bill_Item_No INT,
 Service_Record_ID INT,
 Quantity INT,
 Charge DECIMAL(10,2),
 PRIMARY KEY(Bill_ID,Bill_Item_No),
 FOREIGN KEY(Bill_ID) REFERENCES Bill(Bill_ID) ON DELETE CASCADE,
 FOREIGN KEY(Service_Record_ID) REFERENCES Service_Record(Service_Record_ID)
);

CREATE TABLE Reservation_Log(
 Log_ID INT AUTO_INCREMENT PRIMARY KEY,
 Reservation_ID INT,
 Guest_ID INT,
 Room_ID INT,
 Booking_Date DATE,
 Check_In_Date DATE,
 Check_Out_Date DATE,
 Reservation_Status VARCHAR(30),
 Deleted_On DATETIME
);

DELIMITER $$

CREATE TRIGGER trg_check_room
BEFORE INSERT ON Reservation
FOR EACH ROW
BEGIN
 IF (SELECT Availability_Status FROM Room WHERE Room_ID=NEW.Room_ID) <> 'Available' THEN
   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Room is not available';
 END IF;
END$$

CREATE TRIGGER trg_room_reserved
AFTER INSERT ON Reservation
FOR EACH ROW
BEGIN
 UPDATE Room SET Availability_Status='Reserved'
 WHERE Room_ID=NEW.Room_ID;
END$$

CREATE TRIGGER trg_bill_total
BEFORE INSERT ON Bill
FOR EACH ROW
BEGIN
 SET NEW.Final_Amount = NEW.Total_Amount + NEW.Taxes - NEW.Discounts;
END$$

CREATE TRIGGER trg_reservation_backup
BEFORE DELETE ON Reservation
FOR EACH ROW
BEGIN
 INSERT INTO Reservation_Log
 (Reservation_ID,Guest_ID,Room_ID,Booking_Date,Check_In_Date,Check_Out_Date,Reservation_Status,Deleted_On)
 VALUES
 (OLD.Reservation_ID,OLD.Guest_ID,OLD.Room_ID,OLD.Booking_Date,OLD.Check_In_Date,OLD.Check_Out_Date,OLD.Reservation_Status,NOW());
END$$

DELIMITER ;

CREATE VIEW Available_Rooms AS
SELECT * FROM Room WHERE Availability_Status='Available';

CREATE INDEX idx_room_hotel ON Room(Hotel_ID);
CREATE INDEX idx_res_guest ON Reservation(Guest_ID);
CREATE INDEX idx_service_guest ON Service_Record(Guest_ID);
