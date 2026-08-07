const db = require('../config/db');

exports.getAllServices = async (req, res, next) => {
  try {
    const [services] = await db.query('SELECT * FROM Service ORDER BY Service_ID ASC');
    res.json(services);
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { Service_Name, Service_Charge, Service_Description } = req.body;
    if (!Service_Name || Service_Charge === undefined) {
      return res.status(400).json({ error: 'Service Name and Service Charge are required' });
    }

    const [result] = await db.query(
      'INSERT INTO Service (Service_Name, Service_Charge, Service_Description) VALUES (?, ?, ?)',
      [Service_Name, Service_Charge, Service_Description || null]
    );

    const [newService] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [result.insertId]);
    res.status(201).json(newService[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Service_Name, Service_Charge, Service_Description } = req.body;

    const [existing] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.query(
      `UPDATE Service SET 
        Service_Name = COALESCE(?, Service_Name),
        Service_Charge = COALESCE(?, Service_Charge),
        Service_Description = COALESCE(?, Service_Description)
       WHERE Service_ID = ?`,
      [Service_Name, Service_Charge, Service_Description, id]
    );

    const [updated] = await db.query('SELECT * FROM Service WHERE Service_ID = ?', [id]);
    res.json(updated[0]);
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
      SELECT sr.*, s.Service_Name, p.First_Name, p.Last_Name
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      JOIN Guest g ON sr.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
    `;
    const params = [];
    if (guestId) {
      query += ' WHERE sr.Guest_ID = ?';
      params.push(guestId);
    }
    query += ' ORDER BY sr.Service_Record_ID DESC';

    const [records] = await db.query(query, params);
    res.json(records);
  } catch (err) {
    next(err);
  }
};

exports.assignServiceToGuest = async (req, res, next) => {
  try {
    const { Guest_ID, Service_ID, Quantity, Service_Date } = req.body;
    if (!Guest_ID || !Service_ID) {
      return res.status(400).json({ error: 'Guest and Service are required' });
    }

    const [services] = await db.query('SELECT Service_Charge FROM Service WHERE Service_ID = ?', [Service_ID]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const qty = Quantity || 1;
    const totalCharge = services[0].Service_Charge * qty;
    const date = Service_Date || new Date().toISOString().split('T')[0];

    const [result] = await db.query(
      `INSERT INTO Service_Record (Guest_ID, Service_ID, Service_Date, Quantity, Charge)
       VALUES (?, ?, ?, ?, ?)`,
      [Guest_ID, Service_ID, date, qty, totalCharge]
    );

    const [newRecord] = await db.query(`
      SELECT sr.*, s.Service_Name, p.First_Name, p.Last_Name
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      JOIN Guest g ON sr.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE sr.Service_Record_ID = ?
    `, [result.insertId]);

    res.status(201).json(newRecord[0]);
  } catch (err) {
    next(err);
  }
};
