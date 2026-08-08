const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [hotelsCount] = await db.query('SELECT COUNT(*) as count FROM Hotel');
    const [roomsCount] = await db.query('SELECT COUNT(*) as count FROM Room');
    const [availableRooms] = await db.query("SELECT COUNT(*) as count FROM Room WHERE Availability_Status = 'Available'");
    const [occupiedRooms] = await db.query("SELECT COUNT(*) as count FROM Room WHERE Availability_Status = 'Occupied'");
    const [activeRes] = await db.query("SELECT COUNT(*) as count FROM Reservation WHERE Reservation_Status IN ('Confirmed', 'Checked In')");
    const [guestsToday] = await db.query("SELECT COUNT(DISTINCT Guest_ID) as count FROM Reservation WHERE CURRENT_DATE BETWEEN Check_In_Date AND Check_Out_Date");

    const [todayRevenue] = await db.query("SELECT COALESCE(SUM(Total_Amount + Taxes - Discounts), 0) as total FROM Bill WHERE Payment_Status = 'Paid'");
    const [monthlyRevenue] = await db.query("SELECT COALESCE(SUM(Total_Amount + Taxes - Discounts), 0) as total FROM Bill WHERE Payment_Status = 'Paid'");

    // Occupancy Rate
    const totalR = roomsCount[0].count || 1;
    const occR = occupiedRooms[0].count || 0;
    const occupancyRate = Math.round((occR / totalR) * 100);

    // Chart Data - Revenue per month
    const [revenueByMonth] = await db.query(`
      SELECT DATE_FORMAT(r.Check_Out_Date, '%Y-%m') as Month,
             SUM(b.Total_Amount + b.Taxes - b.Discounts) as Revenue
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      WHERE b.Payment_Status = 'Paid'
      GROUP BY DATE_FORMAT(r.Check_Out_Date, '%Y-%m')
      ORDER BY Month ASC
      LIMIT 12
    `);

    // Room type distribution
    const [roomTypeDist] = await db.query(`
      SELECT Room_Type, COUNT(*) as Count, SUM(CASE WHEN Availability_Status = 'Occupied' THEN 1 ELSE 0 END) as Occupied
      FROM Room
      GROUP BY Room_Type
    `);

    res.json({
      summary: {
        totalHotels: hotelsCount[0].count,
        totalRooms: roomsCount[0].count,
        availableRooms: availableRooms[0].count,
        occupiedRooms: occupiedRooms[0].count,
        activeReservations: activeRes[0].count,
        guestsToday: guestsToday[0].count,
        todayRevenue: todayRevenue[0].total,
        monthlyRevenue: monthlyRevenue[0].total,
        occupancyRate: occupancyRate
      },
      charts: {
        revenueByMonth,
        roomTypeDist
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getHighestSpendingGuests = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT g.Guest_ID, g.Full_Name, g.Email, g.Phone_Number, g.Nationality,
             COUNT(DISTINCT r.Reservation_ID) as Total_Bookings,
             COALESCE(SUM(b.Total_Amount + b.Taxes - b.Discounts), 0) as Total_Spent
      FROM Guest g
      LEFT JOIN Reservation r ON g.Guest_ID = r.Guest_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID AND b.Payment_Status = 'Paid'
      GROUP BY g.Guest_ID
      ORDER BY Total_Spent DESC
      LIMIT 10
    `);

    const formatted = rows.map(r => {
      const parts = (r.Full_Name || '').split(' ');
      return {
        ...r,
        First_Name: parts[0] || '',
        Last_Name: parts.slice(1).join(' ') || ''
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.getUpcomingCheckins = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, g.Full_Name, g.Phone_Number, rm.Room_Number, rm.Room_Type, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_Status = 'Confirmed'
        AND r.Check_In_Date >= CURRENT_DATE
      ORDER BY r.Check_In_Date ASC
    `);

    const formatted = rows.map(r => {
      const parts = (r.Full_Name || '').split(' ');
      return {
        ...r,
        First_Name: parts[0] || '',
        Last_Name: parts.slice(1).join(' ') || ''
      };
    });

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeSalaryReport = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT h.Hotel_Name, h.City,
             COUNT(e.Employee_ID) as Total_Employees,
             SUM(e.Salary) as Total_Salary_Expense,
             AVG(e.Salary) as Average_Salary,
             MIN(e.Salary) as Min_Salary,
             MAX(e.Salary) as Max_Salary
      FROM Hotel h
      LEFT JOIN Employee e ON h.Hotel_ID = e.Hotel_ID
      GROUP BY h.Hotel_ID
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getOccupancyReport = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT h.Hotel_ID, h.Hotel_Name, h.City,
             COUNT(r.Room_ID) as Total_Rooms,
             SUM(CASE WHEN r.Availability_Status = 'Occupied' THEN 1 ELSE 0 END) as Occupied_Rooms,
             SUM(CASE WHEN r.Availability_Status = 'Reserved' THEN 1 ELSE 0 END) as Reserved_Rooms,
             SUM(CASE WHEN r.Availability_Status = 'Available' THEN 1 ELSE 0 END) as Available_Rooms,
             SUM(CASE WHEN r.Availability_Status = 'Maintenance' THEN 1 ELSE 0 END) as Maintenance_Rooms,
             ROUND((SUM(CASE WHEN r.Availability_Status = 'Occupied' THEN 1 ELSE 0 END) / COUNT(r.Room_ID)) * 100, 1) as Occupancy_Percentage
      FROM Hotel h
      LEFT JOIN Room r ON h.Hotel_ID = r.Hotel_ID
      GROUP BY h.Hotel_ID
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
