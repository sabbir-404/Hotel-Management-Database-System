const db = require('../config/db');

exports.checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }

    const cleanUsername = username.trim();

    const [existing] = await db.query(
      'SELECT Person_ID FROM Person WHERE LOWER(Username) = LOWER(?)',
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
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality,
             (SELECT COUNT(*) FROM Reservation r WHERE r.Guest_ID = g.Guest_ID) as Total_Reservations
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      ORDER BY g.Guest_ID DESC
    `);
    res.json(guests);
  } catch (err) {
    next(err);
  }
};

exports.getGuestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE g.Guest_ID = ?
    `, [id]);

    if (guests.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json(guests[0]);
  } catch (err) {
    next(err);
  }
};

// Full Guest Profile Dashboard with Summary Cards & History Collections
exports.getGuestProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Guest personal details
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE g.Guest_ID = ?
    `, [id]);

    if (guests.length === 0) {
      return res.status(404).json({ error: 'Guest profile not found' });
    }

    const guest = guests[0];

    // 2. Reservation History
    const [reservations] = await db.query(`
      SELECT r.*, rm.Room_Number, rm.Room_Type, rm.Nightly_Rate, h.Hotel_Name, h.City,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights,
             (DATEDIFF(r.Check_Out_Date, r.Check_In_Date) * rm.Nightly_Rate) as Room_Charge,
             b.Bill_ID, b.Payment_Status, b.Final_Amount
      FROM Reservation r
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      LEFT JOIN Bill b ON r.Reservation_ID = b.Reservation_ID
      WHERE r.Guest_ID = ?
      ORDER BY r.Reservation_ID DESC
    `, [id]);

    // 3. Service History
    const [services] = await db.query(`
      SELECT sr.*, s.Service_Name, s.Service_Description
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE sr.Guest_ID = ?
      ORDER BY sr.Service_Record_ID DESC
    `, [id]);

    // 4. Billing History
    const [bills] = await db.query(`
      SELECT b.*, r.Check_In_Date, r.Check_Out_Date, rm.Room_Number, h.Hotel_Name
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

// Search Guests by Guest ID, Name, Username, Phone, Email, National ID / Passport
exports.searchGuests = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return exports.getAllGuests(req, res, next);
    }

    const searchTerm = `%${query}%`;
    const [guests] = await db.query(`
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE CAST(g.Guest_ID AS CHAR) LIKE ?
         OR CONCAT(p.First_Name, ' ', p.Last_Name) LIKE ?
         OR p.Username LIKE ?
         OR p.Phone_Number LIKE ?
         OR p.Email LIKE ?
         OR g.Identification_Number LIKE ?
      ORDER BY g.Guest_ID DESC
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json(guests);
  } catch (err) {
    next(err);
  }
};

exports.createGuest = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { First_Name, Last_Name, Username, Phone_Number, Email, Address, Nationality, Identification_Number } = req.body;

    if (!First_Name || !Last_Name || !Phone_Number || !Identification_Number) {
      await connection.rollback();
      return res.status(400).json({ error: 'Full Name, Phone Number, and National ID / Passport are required' });
    }

    // Username validation if provided
    if (Username) {
      const [existingUser] = await connection.query('SELECT Person_ID FROM Person WHERE LOWER(Username) = LOWER(?)', [Username.trim()]);
      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Username is already taken. Please choose another username.' });
      }
    }

    // Phone Uniqueness validation
    const [existingPhone] = await connection.query('SELECT Person_ID FROM Person WHERE Phone_Number = ?', [Phone_Number]);
    if (existingPhone.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Phone number must be unique. A guest with this phone number already exists.' });
    }

    if (Email) {
      const [existingEmail] = await connection.query('SELECT Person_ID FROM Person WHERE Email = ?', [Email]);
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Email must be unique. A guest with this email address already exists.' });
      }
    }

    const [existingId] = await connection.query('SELECT Guest_ID FROM Guest WHERE Identification_Number = ?', [Identification_Number]);
    if (existingId.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'National ID / Passport number must be unique.' });
    }

    // Insert Person
    const [personResult] = await connection.query(
      `INSERT INTO Person (First_Name, Last_Name, Username, Phone_Number, Email, Address, Nationality)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [First_Name, Last_Name, Username ? Username.trim() : null, Phone_Number, Email || null, Address || null, Nationality || 'Bangladeshi']
    );

    const personId = personResult.insertId;
    const regDate = new Date().toISOString().split('T')[0];

    // Insert Guest referencing Person_ID
    await connection.query(
      `INSERT INTO Guest (Guest_ID, Registration_Date, Identification_Number)
       VALUES (?, ?, ?)`,
      [personId, regDate, Identification_Number]
    );

    await connection.commit();

    const [newGuest] = await db.query(`
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE g.Guest_ID = ?
    `, [personId]);

    res.status(201).json(newGuest[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.updateGuest = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { First_Name, Last_Name, Username, Phone_Number, Email, Address, Nationality, Identification_Number } = req.body;

    const [existing] = await connection.query('SELECT * FROM Guest WHERE Guest_ID = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Check Username uniqueness if changed
    if (Username) {
      const [existingUser] = await connection.query('SELECT Person_ID FROM Person WHERE LOWER(Username) = LOWER(?) AND Person_ID != ?', [Username.trim(), id]);
      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Username is already taken by another user.' });
      }
    }

    // Check Phone uniqueness if changed
    if (Phone_Number) {
      const [existingPhone] = await connection.query('SELECT Person_ID FROM Person WHERE Phone_Number = ? AND Person_ID != ?', [Phone_Number, id]);
      if (existingPhone.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Phone number already in use by another person.' });
      }
    }

    // Check Email uniqueness if changed
    if (Email) {
      const [existingEmail] = await connection.query('SELECT Person_ID FROM Person WHERE Email = ? AND Person_ID != ?', [Email, id]);
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Email already in use by another person.' });
      }
    }

    // Check Identification_Number uniqueness if changed
    if (Identification_Number) {
      const [existingId] = await connection.query('SELECT Guest_ID FROM Guest WHERE Identification_Number = ? AND Guest_ID != ?', [Identification_Number, id]);
      if (existingId.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'National ID / Passport already in use.' });
      }
    }

    // Update Person fields
    await connection.query(
      `UPDATE Person SET 
        First_Name = COALESCE(?, First_Name),
        Last_Name = COALESCE(?, Last_Name),
        Username = COALESCE(?, Username),
        Phone_Number = COALESCE(?, Phone_Number),
        Email = COALESCE(?, Email),
        Address = COALESCE(?, Address),
        Nationality = COALESCE(?, Nationality)
       WHERE Person_ID = ?`,
      [First_Name, Last_Name, Username ? Username.trim() : null, Phone_Number, Email, Address, Nationality, id]
    );

    // Update Guest fields
    if (Identification_Number) {
      await connection.query(
        'UPDATE Guest SET Identification_Number = ? WHERE Guest_ID = ?',
        [Identification_Number, id]
      );
    }

    await connection.commit();

    const [updated] = await db.query(`
      SELECT g.Guest_ID, g.Registration_Date, g.Identification_Number,
             p.First_Name, p.Last_Name, p.Username, p.Phone_Number, p.Email, p.Address, p.Nationality
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE g.Guest_ID = ?
    `, [id]);

    res.json(updated[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.deleteGuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Guest WHERE Guest_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    await db.query('DELETE FROM Person WHERE Person_ID = ?', [id]);
    res.json({ message: 'Guest deleted successfully', Guest_ID: id });
  } catch (err) {
    next(err);
  }
};
