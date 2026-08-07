const db = require('../config/db');

exports.getAllReservations = async (req, res, next) => {
  try {
    const { status, guestId, hotelId } = req.query;
    let query = `
      SELECT r.*, 
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate,
             h.Hotel_Name, h.Hotel_ID,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, b.Final_Amount
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.Reservation_Status = ?';
      params.push(status);
    }
    if (guestId) {
      query += ' AND r.Guest_ID = ?';
      params.push(guestId);
    }
    if (hotelId) {
      query += ' AND rm.Hotel_ID = ?';
      params.push(hotelId);
    }

    query += ' ORDER BY r.Reservation_ID DESC';

    const [reservations] = await db.query(query, params);
    res.json(reservations);
  } catch (err) {
    next(err);
  }
};

exports.getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [reservations] = await db.query(`
      SELECT r.*, 
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email, p.Identification_Number,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate,
             h.Hotel_Name, h.City,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, b.Final_Amount
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      WHERE r.Reservation_ID = ?
    `, [id]);

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservations[0]);
  } catch (err) {
    next(err);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const { Guest_ID, Room_ID, Check_In_Date, Check_Out_Date, Number_of_Guests } = req.body;

    if (!Guest_ID || !Room_ID || !Check_In_Date || !Check_Out_Date) {
      return res.status(400).json({ error: 'Guest, Room, Check In, and Check Out dates are required' });
    }

    const checkIn = new Date(Check_In_Date);
    const checkOut = new Date(Check_Out_Date);
    if (checkOut <= checkIn) {
      return res.status(400).json({ error: 'Check Out date must be after Check In date' });
    }

    // Check Room Availability
    const [rooms] = await db.query('SELECT Availability_Status, Nightly_Rate FROM Room WHERE Room_ID = ?', [Room_ID]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (rooms[0].Availability_Status !== 'Available') {
      return res.status(400).json({ error: `Room is currently ${rooms[0].Availability_Status}` });
    }

    const bookingDate = new Date().toISOString().split('T')[0];

    const [result] = await db.query(
      `INSERT INTO Reservation (Guest_ID, Room_ID, Booking_Date, Check_In_Date, Check_Out_Date, Reservation_Status, Number_of_Guests)
       VALUES (?, ?, ?, ?, ?, 'Confirmed', ?)`,
      [Guest_ID, Room_ID, bookingDate, Check_In_Date, Check_Out_Date, Number_of_Guests || 1]
    );

    // Update room status
    await db.query(`UPDATE Room SET Availability_Status = 'Reserved' WHERE Room_ID = ?`, [Room_ID]);

    const [newRes] = await db.query(`
      SELECT r.*, p.First_Name, p.Last_Name, rm.Room_Number, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_ID = ?
    `, [result.insertId]);

    res.status(201).json(newRes[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Reservation_Status, Check_In_Date, Check_Out_Date, Number_of_Guests } = req.body;

    const [existing] = await db.query('SELECT * FROM Reservation WHERE Reservation_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const currentStatus = existing[0].Reservation_Status;
    const newStatus = Reservation_Status || currentStatus;
    const roomId = existing[0].Room_ID;

    await db.query(
      `UPDATE Reservation SET 
        Reservation_Status = ?,
        Check_In_Date = COALESCE(?, Check_In_Date),
        Check_Out_Date = COALESCE(?, Check_Out_Date),
        Number_of_Guests = COALESCE(?, Number_of_Guests)
       WHERE Reservation_ID = ?`,
      [newStatus, Check_In_Date, Check_Out_Date, Number_of_Guests, id]
    );

    // Update Room Availability Status based on Reservation workflow
    if (newStatus === 'Checked In') {
      await db.query(`UPDATE Room SET Availability_Status = 'Occupied' WHERE Room_ID = ?`, [roomId]);
    } else if (newStatus === 'Checked Out' || newStatus === 'Cancelled') {
      await db.query(`UPDATE Room SET Availability_Status = 'Available' WHERE Room_ID = ?`, [roomId]);
    }

    const [updated] = await db.query(`
      SELECT r.*, p.First_Name, p.Last_Name, rm.Room_Number, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_ID = ?
    `, [id]);

    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Reservation WHERE Reservation_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const roomId = existing[0].Room_ID;

    // Delete reservation (triggers MySQL trg_reservation_backup automatically)
    await db.query('DELETE FROM Reservation WHERE Reservation_ID = ?', [id]);

    // Free up room if it was reserved or occupied
    await db.query(`UPDATE Room SET Availability_Status = 'Available' WHERE Room_ID = ?`, [roomId]);

    res.json({ message: 'Reservation deleted and backed up to Reservation_Log', Reservation_ID: id });
  } catch (err) {
    next(err);
  }
};
