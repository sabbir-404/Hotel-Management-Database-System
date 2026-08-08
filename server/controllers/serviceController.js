const db = require('../config/db');

const mapServiceFields = (s) => {
  if (!s) return s;
  return {
    ...s,
    Service_Name: s.Service_Name || s.Service_Type
  };
};

exports.getAllServices = async (req, res, next) => {
  try {
    const [services] = await db.query('SELECT * FROM Service ORDER BY Service_ID ASC');
    res.json(services.map(mapServiceFields));
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { Service_Type, Service_Name, Service_Charge, Service_Description } = req.body;
    const type = Service_Type || Service_Name;

    if (!type) {
      return res.status(400).json({ error: 'Service Type is required' });
    }

    const [result] = await db.query(
      'INSERT INTO Service (Service_Type, Service_Name, Service_Charge, Service_Description) VALUES (?, ?, ?, ?)',
      [type, Service_Name || type, Service_Charge || 0.00, Service_Description || null]
    );

    const [newService] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [result.insertId]);
    res.status(201).json(mapServiceFields(newService[0]));
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Service_Type, Service_Name, Service_Charge, Service_Description } = req.body;

    const [existing] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query(
      `UPDATE Service SET 
        Service_Type = COALESCE(?, Service_Type),
        Service_Name = COALESCE(?, Service_Name),
        Service_Charge = COALESCE(?, Service_Charge),
        Service_Description = COALESCE(?, Service_Description)
       WHERE Service_ID = ?`,
      [Service_Type, Service_Name, Service_Charge, Service_Description, id]
    );

    const [updated] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [id]);
    res.json(mapServiceFields(updated[0]));
  } catch (err) {
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query('DELETE FROM Service WHERE Service_ID = ?', [id]);
    res.json({ message: 'Service deleted successfully', Service_ID: id });
  } catch (err) {
    next(err);
  }
};

// Service Records (assigning service to guest)
exports.getGuestServiceRecords = async (req, res, next) => {
  try {
    const { guestId } = req.query;
    let query = `
      SELECT sr.*, s.Service_Type, COALESCE(s.Service_Name, s.Service_Type) as Service_Name, g.Full_Name
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      JOIN Guest g ON sr.Guest_ID = g.Guest_ID
    `;
    const params = [];
    if (guestId) {
      query += ' WHERE sr.Guest_ID = ?';
      params.push(guestId);
    }
    query += ' ORDER BY sr.Service_Record_ID DESC';

    const [records] = await db.query(query, params);
    
    const formatted = records.map(r => {
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

exports.assignServiceToGuest = async (req, res, next) => {
  try {
    const { Guest_ID, Service_ID, Reservation_ID, Quantity, Service_Date, Charge, Total_Cost } = req.body;
    if (!Guest_ID || !Service_ID) {
      return res.status(400).json({ error: 'Guest and Service are required' });
    }

    // Validate Guest existence
    const [guests] = await db.query('SELECT Guest_ID FROM Guest WHERE Guest_ID = ?', [Guest_ID]);
    if (guests.length === 0) {
      return res.status(404).json({ error: `Guest account #${Guest_ID} not found. Please re-login.` });
    }

    const [services] = await db.query('SELECT Service_Type, Service_Charge FROM Service WHERE Service_ID = ?', [Service_ID]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const qty = Quantity || 1;
    const unitCharge = services[0].Service_Charge ? parseFloat(services[0].Service_Charge) : 500;
    const totalCharge = Total_Cost !== undefined ? parseFloat(Total_Cost) : (Charge !== undefined ? parseFloat(Charge) : unitCharge * qty);
    const date = Service_Date || new Date().toISOString().split('T')[0];

    // Find or create Bill associated with Reservation_ID if provided
    let billId = null;
    if (Reservation_ID) {
      const [bills] = await db.query('SELECT Bill_ID FROM Bill WHERE Reservation_ID = ?', [Reservation_ID]);
      if (bills.length > 0) {
        billId = bills[0].Bill_ID;
      } else {
        const [newBill] = await db.query(
          'INSERT INTO Bill (Reservation_ID, Total_Amount, Payment_Status) VALUES (?, ?, ?)',
          [Reservation_ID, 0.00, 'Pending']
        );
        billId = newBill.insertId;
      }
    }

    // Insert into Service_Record using column Charge
    const [result] = await db.query(
      `INSERT INTO Service_Record (Guest_ID, Service_ID, Bill_ID, Service_Date, Quantity, Charge)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Guest_ID, Service_ID, billId, date, qty, totalCharge]
    );

    // Update Bill Total_Amount if billId exists
    if (billId) {
      await db.query('UPDATE Bill SET Total_Amount = Total_Amount + ? WHERE Bill_ID = ?', [totalCharge, billId]);
    }

    const [newRecord] = await db.query(`
      SELECT sr.*, s.Service_Type, COALESCE(s.Service_Name, s.Service_Type) as Service_Name, g.Full_Name
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      JOIN Guest g ON sr.Guest_ID = g.Guest_ID
      WHERE sr.Service_Record_ID = ?
    `, [result.insertId]);

    const parts = (newRecord[0]?.Full_Name || '').split(' ');
    const formatted = {
      ...newRecord[0],
      First_Name: parts[0] || '',
      Last_Name: parts.slice(1).join(' ') || ''
    };

    res.status(201).json(formatted);
  } catch (err) {
    next(err);
  }
};
