const db = require('../config/db');

const mapResFields = (r) => {
  if (!r) return r;
  const parts = (r.Full_Name || '').split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return {
    ...r,
    First_Name: r.First_Name || firstName,
    Last_Name: r.Last_Name || lastName
  };
};

exports.getAllReservations = async (req, res, next) => {
  try {
    const { status, guestId, hotelId } = req.query;
    let query = `
      SELECT r.*, 
             g.Full_Name, g.Phone_Number, g.Email,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate,
             h.Hotel_Name, h.Hotel_ID,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
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
    res.json(reservations.map(mapResFields));
  } catch (err) {
    next(err);
  }
};

exports.getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [reservations] = await db.query(`
      SELECT r.*, 
             g.Full_Name, g.Phone_Number, g.Email, g.Identification_Number,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate,
             h.Hotel_Name, h.City,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      WHERE r.Reservation_ID = ?
    `, [id]);

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(mapResFields(reservations[0]));
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

    // Check Guest Existence in Guest table
    const [guestCheck] = await db.query('SELECT Guest_ID FROM Guest WHERE Guest_ID = ?', [Guest_ID]);
    if (guestCheck.length === 0) {
      return res.status(400).json({ 
        error: `Invalid Guest ID (${Guest_ID}). The guest account was not found in the database. Please log out and sign in again or select a valid guest.` 
      });
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
      SELECT r.*, g.Full_Name, rm.Room_Number, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_ID = ?
    `, [result.insertId]);

    res.status(201).json(mapResFields(newRes[0]));
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
      SELECT r.*, g.Full_Name, rm.Room_Number, h.Hotel_Name
      FROM Reservation r
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Reservation_ID = ?
    `, [id]);

    res.json(mapResFields(updated[0]));
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

    await db.query('DELETE FROM Reservation WHERE Reservation_ID = ?', [id]);
    await db.query(`UPDATE Room SET Availability_Status = 'Available' WHERE Room_ID = ?`, [roomId]);

    res.json({ message: 'Reservation deleted successfully', Reservation_ID: id });
  } catch (err) {
    next(err);
  }
};
