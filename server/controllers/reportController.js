const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [hotelsCount] = await db.query('SELECT COUNT(*) as count FROM Hotel');
    const [roomsCount] = await db.query('SELECT COUNT(*) as count FROM Room');
    const [availableRooms] = await db.query("SELECT COUNT(*) as count FROM Room WHERE Availability_Status = 'Available'");
    const [occupiedRooms] = await db.query("SELECT COUNT(*) as count FROM Room WHERE Availability_Status = 'Occupied'");
    const [activeRes] = await db.query("SELECT COUNT(*) as count FROM Reservation WHERE Reservation_Status IN ('Confirmed', 'Checked In')");
    const [guestsToday] = await db.query("SELECT COUNT(DISTINCT Guest_ID) as count FROM Reservation WHERE CURRENT_DATE BETWEEN Check_In_Date AND Check_Out_Date");

    const [todayRevenue] = await db.query("SELECT COALESCE(SUM(Final_Amount), 0) as total FROM Bill WHERE Billing_Date = CURRENT_DATE");
    const [monthlyRevenue] = await db.query("SELECT COALESCE(SUM(Final_Amount), 0) as total FROM Bill WHERE MONTH(Billing_Date) = MONTH(CURRENT_DATE) AND YEAR(Billing_Date) = YEAR(CURRENT_DATE)");

    // Occupancy Rate
    const totalR = roomsCount[0].count || 1;
    const occR = occupiedRooms[0].count || 0;
    const occupancyRate = Math.round((occR / totalR) * 100);

    // Chart Data - Revenue per month
    const [revenueByMonth] = await db.query(`
      SELECT DATE_FORMAT(Billing_Date, '%Y-%m') as Month,
             SUM(Final_Amount) as Revenue
      FROM Bill
      GROUP BY DATE_FORMAT(Billing_Date, '%Y-%m')
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
      SELECT g.Guest_ID, p.First_Name, p.Last_Name, p.Email, p.Phone_Number, p.Nationality,
             COUNT(DISTINCT r.Reservation_ID) as Total_Bookings,
             COALESCE(SUM(b.Final_Amount), 0) as Total_Spent
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      LEFT JOIN Reservation r ON g.Guest_ID = r.Guest_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      GROUP BY g.Guest_ID
      ORDER BY Total_Spent DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getUpcomingCheckins = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, p.First_Name, p.Last_Name, p.Phone_Number, rm.Room_Number, rm.Room_Type, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_Status = 'Confirmed'
        AND r.Check_In_Date >= CURRENT_DATE
      ORDER BY r.Check_In_Date ASC
    `);
    res.json(rows);
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
