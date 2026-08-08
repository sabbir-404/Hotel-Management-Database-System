const db = require('../config/db');

const mapGuestFields = (g) => {
  if (!g) return g;
  const parts = (g.Full_Name || '').split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return {
    ...g,
    First_Name: g.First_Name || firstName,
    Last_Name: g.Last_Name || lastName
  };
};

exports.checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }

    const cleanUsername = username.trim();

    const [existing] = await db.query(
      'SELECT Guest_ID FROM Guest WHERE LOWER(Username) = LOWER(?)',
      [cleanUsername]
    );

    if (existing.length > 0) {
      return res.json({ available: false, message: 'Username is already taken' });
    }

    res.json({ available: true, message: 'Username is available' });
  } catch (err) {
    next(err);
  }
};

exports.getAllGuests = async (req, res, next) => {
  try {
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Full_Name, g.Phone_Number, g.Email, g.Address, g.Nationality,
             g.Identification_Number, g.Username,
             (SELECT COUNT(*) FROM Reservation r WHERE r.Guest_ID = g.Guest_ID) as Total_Reservations
      FROM Guest g
      ORDER BY g.Guest_ID DESC
    `);
    res.json(guests.map(mapGuestFields));
  } catch (err) {
    next(err);
  }
};

exports.getGuestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Full_Name, g.Phone_Number, g.Email, g.Address, g.Nationality,
             g.Identification_Number, g.Username
      FROM Guest g
      WHERE g.Guest_ID = ?
    `, [id]);

    if (guests.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json(mapGuestFields(guests[0]));
  } catch (err) {
    next(err);
  }
};

exports.getGuestProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Guest personal details from Guest table
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Full_Name, g.Phone_Number, g.Email, g.Address, g.Nationality,
             g.Identification_Number, g.Username
      FROM Guest g
      WHERE g.Guest_ID = ?
    `, [id]);

    if (guests.length === 0) {
      return res.status(404).json({ error: 'Guest profile not found' });
    }

    const guest = mapGuestFields(guests[0]);

    // 2. Reservation History
    const [reservations] = await db.query(`
      SELECT r.*, rm.Room_Number, rm.Room_Type, rm.Nightly_Rate, h.Hotel_Name, h.City,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount
      FROM Reservation r
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      WHERE r.Guest_ID = ?
      ORDER BY r.Reservation_ID DESC
    `, [id]);

    // 3. Service History
    const [services] = await db.query(`
      SELECT sr.*, s.Service_Type, s.Service_Name, s.Service_Description
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE sr.Guest_ID = ?
      ORDER BY sr.Service_Record_ID DESC
    `, [id]);

    // 4. Billing History
    const [bills] = await db.query(`
      SELECT b.*, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount,
             r.Check_In_Date, r.Check_Out_Date, rm.Room_Number, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE r.Guest_ID = ?
      ORDER BY b.Bill_ID DESC
    `, [id]);

    // Compute Summary Cards
    const activeRes = reservations.find(r => r.Reservation_Status === 'Checked In' || r.Reservation_Status === 'Confirmed');
    const previousResCount = reservations.filter(r => r.Reservation_Status === 'Checked Out').length;
    const currentRoom = activeRes ? `Room ${activeRes.Room_Number} (${activeRes.Hotel_Name})` : 'None';
    const totalServicesCount = services.reduce((acc, curr) => acc + (curr.Quantity || 1), 0);
    
    let outstandingBill = 0;
    let totalSpent = 0;
    bills.forEach(b => {
      const amt = parseFloat(b.Final_Amount || 0);
      if (b.Payment_Status === 'Pending') {
        outstandingBill += amt;
      } else if (b.Payment_Status === 'Paid') {
        totalSpent += amt;
      }
    });

    res.json({
      guest,
      summary: {
        activeReservation: activeRes ? `#RES-${activeRes.Reservation_ID}` : 'None',
        previousReservations: previousResCount,
        currentRoom,
        totalServicesUsed: totalServicesCount,
        outstandingBill,
        totalAmountSpent: totalSpent
      },
      reservations,
      services,
      bills
    });
  } catch (err) {
    next(err);
  }
};

exports.searchGuests = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return exports.getAllGuests(req, res, next);
    }

    const searchTerm = `%${query}%`;
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Full_Name, g.Phone_Number, g.Email, g.Address, g.Nationality,
             g.Identification_Number, g.Username
      FROM Guest g
      WHERE CAST(g.Guest_ID AS CHAR) LIKE ?
         OR g.Full_Name LIKE ?
         OR g.Username LIKE ?
         OR g.Phone_Number LIKE ?
         OR g.Email LIKE ?
         OR g.Identification_Number LIKE ?
      ORDER BY g.Guest_ID DESC
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json(guests.map(mapGuestFields));
  } catch (err) {
    next(err);
  }
};

exports.createGuest = async (req, res, next) => {
  try {
    const { Full_Name, First_Name, Last_Name, Username, Password, Phone_Number, Email, Address, Nationality, Identification_Number } = req.body;

    const guestFullName = Full_Name || `${First_Name || ''} ${Last_Name || ''}`.trim();

    if (!guestFullName || !Phone_Number || !Identification_Number) {
      return res.status(400).json({ error: 'Full Name, Phone Number, and National ID / Passport are required' });
    }

    if (Username) {
      const [existingUser] = await db.query('SELECT Guest_ID FROM Guest WHERE LOWER(Username) = LOWER(?)', [Username.trim()]);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another username.' });
      }
    }

    const [existingPhone] = await db.query('SELECT Guest_ID FROM Guest WHERE Phone_Number = ?', [Phone_Number]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number must be unique. A guest with this phone number already exists.' });
    }

    if (Email) {
      const [existingEmail] = await db.query('SELECT Guest_ID FROM Guest WHERE Email = ?', [Email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email must be unique. A guest with this email address already exists.' });
      }
    }

    const [existingId] = await db.query('SELECT Guest_ID FROM Guest WHERE Identification_Number = ?', [Identification_Number]);
    if (existingId.length > 0) {
      return res.status(400).json({ error: 'National ID / Passport number must be unique.' });
    }

    const [result] = await db.query(
      `INSERT INTO Guest (Full_Name, Phone_Number, Email, Address, Nationality, Identification_Number, Username, Password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [guestFullName, Phone_Number, Email || null, Address || null, Nationality || 'Bangladeshi', Identification_Number, Username ? Username.trim() : null, Password ? Password.trim() : 'password']
    );

    const newGuestId = result.insertId;

    const [newGuest] = await db.query(`
      SELECT Guest_ID, Full_Name, Phone_Number, Email, Address, Nationality, Identification_Number, Username
      FROM Guest
      WHERE Guest_ID = ?
    `, [newGuestId]);

    res.status(201).json(mapGuestFields(newGuest[0]));
  } catch (err) {
    next(err);
  }
};

exports.updateGuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Full_Name, First_Name, Last_Name, Username, Phone_Number, Email, Address, Nationality, Identification_Number } = req.body;

    const [existing] = await db.query('SELECT * FROM Guest WHERE Guest_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const guestFullName = Full_Name || (First_Name || Last_Name ? `${First_Name || ''} ${Last_Name || ''}`.trim() : null);

    if (Username) {
      const [existingUser] = await db.query('SELECT Guest_ID FROM Guest WHERE LOWER(Username) = LOWER(?) AND Guest_ID != ?', [Username.trim(), id]);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username is already taken by another user.' });
      }
    }

    if (Phone_Number) {
      const [existingPhone] = await db.query('SELECT Guest_ID FROM Guest WHERE Phone_Number = ? AND Guest_ID != ?', [Phone_Number, id]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ error: 'Phone number already in use.' });
      }
    }

    if (Email) {
      const [existingEmail] = await db.query('SELECT Guest_ID FROM Guest WHERE Email = ? AND Guest_ID != ?', [Email, id]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
    }

    if (Identification_Number) {
      const [existingId] = await db.query('SELECT Guest_ID FROM Guest WHERE Identification_Number = ? AND Guest_ID != ?', [Identification_Number, id]);
      if (existingId.length > 0) {
        return res.status(400).json({ error: 'National ID / Passport already in use.' });
      }
    }

    await db.query(
      `UPDATE Guest SET
        Full_Name = COALESCE(?, Full_Name),
        Phone_Number = COALESCE(?, Phone_Number),
        Email = COALESCE(?, Email),
        Address = COALESCE(?, Address),
        Nationality = COALESCE(?, Nationality),
        Identification_Number = COALESCE(?, Identification_Number),
        Username = COALESCE(?, Username)
       WHERE Guest_ID = ?`,
      [guestFullName, Phone_Number, Email, Address, Nationality, Identification_Number, Username ? Username.trim() : null, id]
    );

    const [updated] = await db.query(`
      SELECT Guest_ID, Full_Name, Phone_Number, Email, Address, Nationality, Identification_Number, Username
      FROM Guest
      WHERE Guest_ID = ?
    `, [id]);

    res.json(mapGuestFields(updated[0]));
  } catch (err) {
    next(err);
  }
};

exports.deleteGuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Guest WHERE Guest_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    await db.query('DELETE FROM Guest WHERE Guest_ID = ?', [id]);
    res.json({ message: 'Guest deleted successfully', Guest_ID: id });
  } catch (err) {
    next(err);
  }
};
