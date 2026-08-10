const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'Hotel_Management_System';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log(`Ensuring database '${dbName}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.changeUser({ database: dbName });

    // Fix Error 194 (Tablespace is missing) by discarding tablespaces & dropping all existing tables
    console.log(`Cleaning up existing tables and missing tablespaces...`);
    await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);

    // Drop views first
    try { await connection.query(`DROP VIEW IF EXISTS Available_Rooms;`); } catch (e) {}

    // Get list of all tables
    const [tables] = await connection.query(`SHOW TABLES;`);
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      } catch (err) {
        console.warn(`Attempting tablespace discard on '${tableName}' due to: ${err.message}`);
        try {
          await connection.query(`ALTER TABLE \`${tableName}\` DISCARD TABLESPACE;`);
          await connection.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
        } catch (discardErr) {
          console.warn(`Could not drop table '${tableName}': ${discardErr.message}`);
        }
      }
    }

    await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);

    // Read and execute SQL schema
    const sqlPath = path.join(__dirname, '../../Hotel_Management_System.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL schema file not found at ${sqlPath}`);
      process.exit(1);
    }

    console.log(`Reading SQL schema file...`);
    let sql = fs.readFileSync(sqlPath, 'utf8');
    sql = sql.replace(/DELIMITER \$\$/g, '').replace(/DELIMITER ;/g, '').replace(/\$\$/g, ';');

    console.log(`Executing SQL Schema script...`);
    try {
      await connection.query(sql);
      console.log(`Schema imported successfully!`);
    } catch (err) {
      console.warn(`Note during SQL schema import:`, err.message);
    }

    // Ensure UI enhancement columns exist
    try { await connection.query(`ALTER TABLE Hotel ADD COLUMN Image_Url VARCHAR(500);`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Room ADD COLUMN Sale_Rate DECIMAL(10,2);`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Room ADD COLUMN Room_Description TEXT;`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Guest ADD COLUMN Username VARCHAR(100) UNIQUE;`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Guest ADD COLUMN Password VARCHAR(255);`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Employee ADD COLUMN Password VARCHAR(255);`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Service ADD COLUMN Service_Name VARCHAR(100);`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Service ADD COLUMN Service_Charge DECIMAL(10,2) DEFAULT 0;`); } catch (e) {}
    try { await connection.query(`ALTER TABLE Service ADD COLUMN Service_Description TEXT;`); } catch (e) {}

    // Seed 6 Hotels in Bangladesh
    console.log('Seeding 6 Bangladesh Hotels (Dhaka, Cox\'s Bazar, Sylhet, Chittagong, Rangamati, Sreemangal)...');
    await connection.query(`
      INSERT INTO Hotel (Hotel_ID, Hotel_Name, Address, City, Contact_Number, Star_Rating, Image_Url) VALUES
      (1, 'Hotel.com Grand Palace', '78 Gulshan Avenue, Block SE(F)', 'Dhaka', '+880-1711-001122', 5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
      (2, 'Hotel.com Bay Breeze Resort', 'Kolatoli Beach Road', 'Cox''s Bazar', '+880-1819-334455', 4, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'),
      (3, 'Hotel.com Tea Garden Lodge', 'Zindabazar Commercial Area', 'Sylhet', '+880-1912-667788', 4, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'),
      (4, 'Hotel.com Cloud Nine Resort', 'Agrabad Commercial Area', 'Chittagong', '+880-1311-445566', 5, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
      (5, 'Hotel.com Lakeside Haven', 'Kaptai Lake Road', 'Rangamati', '+880-1411-778899', 4, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80'),
      (6, 'Hotel.com Heritage Eco Lodge', 'Grand Trunk Road', 'Sreemangal', '+880-1511-223344', 4, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80');
    `);

    // Seed Guests directly into Guest table (no Person table)
    console.log('Seeding Guests and Employees directly into entity tables...');
    await connection.query(`
      INSERT INTO Guest (Guest_ID, Full_Name, Phone_Number, Email, Address, Nationality, Identification_Number, Username, Password) VALUES
      (1, 'Tanvir Rahman', '+8801700112233', 'tanvir.rahman@example.com', 'House 42, Road 11, Banani, Dhaka', 'Bangladeshi', 'NID-1994829102938', 'tanvir', 'password'),
      (2, 'Nusrat Jahan', '+8801811223344', 'nusrat.jahan@example.com', '78 Agrabad C/A, Chittagong', 'Bangladeshi', 'NID-1988471928374', 'nusrat', 'password'),
      (3, 'Arif Hossain', '+8801922334455', 'arif.hossain@example.com', 'Dolphin Circle, Cox''s Bazar', 'Bangladeshi', 'PASSPORT-A09823411', 'arif', 'password'),
      (4, 'Sabbir Hossain', '+8801799887766', 'sabbir@example.com', 'Dhaka', 'Bangladeshi', 'NID-9988776655', 'sabbir', '1234');
    `);

    // Seed Employees directly into Employee table (no Person table)
    await connection.query(`
      INSERT INTO Employee (Employee_ID, Hotel_ID, Full_Name, Role, Designation, Salary, Joining_Date, Employment_Status, Username, Password) VALUES
      (1, 1, 'System Administrator', 'Admin', 'System Admin', 120000.00, '2024-01-01', 'Active', 'admin', 'admin123'),
      (2, 1, 'Mahmud Hasan', 'Receptionist', 'Front Desk Executive', 45000.00, '2024-06-15', 'Active', 'receptionist', 'admin123');
    `);

    // Seed Rooms across all 6 hotels
    console.log('Seeding Rooms (BDT ৳ rates & sale rates)...');
    await connection.query(`
      INSERT INTO Room (Room_ID, Hotel_ID, Room_Number, Room_Type, Floor_Number, Capacity, Nightly_Rate, Sale_Rate, Room_Description, Availability_Status) VALUES
      (1, 1, '101', 'Single', 1, 1, 4500.00, 3500.00, 'Single Deluxe Room • Air conditioning • King bed • Breakfast included • Free cancellation', 'Available'),
      (2, 1, '102', 'Double', 1, 2, 8000.00, 6500.00, 'Executive Double Room • Ocean / City balcony view • Free Wi-Fi • Breakfast included', 'Available'),
      (3, 1, '201', 'Suite', 2, 3, 18000.00, 15000.00, 'Presidential Luxury Suite • Private lounge • Jacuzzi bath • Complimentary airport transfer', 'Available'),
      (4, 1, '301', 'Deluxe', 3, 4, 14000.00, 12000.00, 'Deluxe Family Suite • 2 King beds • Air conditioning • Complimentary breakfast tray', 'Available'),
      (5, 2, 'A1', 'Double', 1, 2, 7000.00, 5500.00, 'Beachfront Sea View Room • Private balcony • Air conditioning • Free cancellation', 'Available'),
      (6, 2, 'B2', 'Suite', 2, 4, 22000.00, 18000.00, 'Oceanfront Luxury Villa Suite • Swimming pool access • Free breakfast • Private terrace', 'Available'),
      (7, 3, 'T101', 'Deluxe', 1, 2, 5000.00, 4000.00, 'Tea Garden View Eco Lodge • King bed • Air conditioning • Organic herbal breakfast', 'Available'),
      (8, 4, 'C101', 'Suite', 1, 2, 12000.00, 9500.00, 'Chittagong Port View Executive Suite • King Bed • Free Wi-Fi • Buffet Breakfast', 'Available'),
      (9, 5, 'R201', 'Deluxe', 2, 2, 6500.00, 5000.00, 'Kaptai Lakefront Cottage • Hill balcony view • Kayak boat rental included', 'Available'),
      (10, 6, 'S301', 'Double', 3, 3, 7500.00, 6000.00, 'Sreemangal Rainforest Bungalow • Tea tasting tour included • Complimentary breakfast', 'Available');
    `);

    // Seed Services
    console.log('Seeding Services...');
    await connection.query(`
      INSERT INTO Service (Service_ID, Service_Type, Service_Name, Service_Charge, Service_Description) VALUES
      (1, 'Laundry', 'Express Laundry & Pressing', 500.00, 'Full laundry wash, iron, and same-day room delivery'),
      (2, 'Spa', 'Luxury Spa & Herbal Therapy', 3500.00, '90-minute aromatherapy and traditional thermal relaxation'),
      (3, 'Transportation', 'Airport Chauffeur Transfer', 2500.00, 'Private sedan transport to/from Hazrat Shahjalal Airport'),
      (4, 'Room Service', 'Gourmet Room Service Dining', 1200.00, '24/7 in-room dining tray service with local & continental dishes');
    `);

    // Seed Reservations & Bills & Service_Records
    console.log('Seeding Reservations, Bills & Service Records...');
    await connection.query(`
      INSERT INTO Reservation (Reservation_ID, Guest_ID, Room_ID, Booking_Date, Check_In_Date, Check_Out_Date, Reservation_Status, Number_of_Guests) VALUES
      (1, 1, 3, '2026-07-20', '2026-08-01', '2026-08-05', 'Checked In', 2),
      (2, 2, 2, '2026-07-25', '2026-08-03', '2026-08-07', 'Confirmed', 2);
    `);

    await connection.query(`UPDATE Room SET Availability_Status = 'Occupied' WHERE Room_ID = 3;`);
    await connection.query(`UPDATE Room SET Availability_Status = 'Reserved' WHERE Room_ID = 2;`);

    await connection.query(`
      INSERT INTO Bill (Bill_ID, Reservation_ID, Total_Amount, Taxes, Discounts, Payment_Method, Payment_Status) VALUES
      (1, 1, 65900.00, 0.00, 2000.00, 'Card', 'Paid');
    `);

    await connection.query(`
      INSERT INTO Service_Record (Service_Record_ID, Guest_ID, Service_ID, Bill_ID, Service_Date, Quantity, Charge) VALUES
      (1, 1, 2, 1, '2026-08-02', 1, 3500.00),
      (2, 1, 4, 1, '2026-08-02', 2, 2400.00);
    `);

    console.log('Database successfully initialized according to CSE-303 ERD specification!');
    await connection.end();
  } catch (error) {
    console.error('Database Initialization Failed:', error.message);
    process.exit(1);
  }
}

initDb();
