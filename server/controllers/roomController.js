const db = require('../config/db');

exports.getAllRooms = async (req, res, next) => {
  try {
    const { hotelId, type, status, minRate, maxRate } = req.query;
    let query = `
      SELECT r.*, h.Hotel_Name, h.City
      FROM Room r
      JOIN Hotel h ON r.Hotel_ID = h.Hotel_ID
      WHERE 1=1
    `;
    const params = [];

    if (hotelId) {
      query += ' AND r.Hotel_ID = ?';
      params.push(hotelId);
    }
    if (type) {
      query += ' AND r.Room_Type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND r.Availability_Status = ?';
      params.push(status);
    }
    if (minRate) {
      query += ' AND r.Nightly_Rate >= ?';
      params.push(minRate);
    }
    if (maxRate) {
      query += ' AND r.Nightly_Rate <= ?';
      params.push(maxRate);
    }

    query += ' ORDER BY r.Hotel_ID, r.Room_Number ASC';

    const [rooms] = await db.query(query, params);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

exports.getAvailableRooms = async (req, res, next) => {
  try {
    const [rooms] = await db.query(`
      SELECT r.*, h.Hotel_Name 
      FROM Available_Rooms r
      JOIN Hotel h ON r.Hotel_ID = h.Hotel_ID
      ORDER BY r.Room_Number ASC
    `);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { Hotel_ID, Room_Number, Room_Type, Floor_Number, Capacity, Nightly_Rate, Sale_Rate, Room_Description, Availability_Status } = req.body;
    if (!Hotel_ID || !Room_Number || !Room_Type || !Nightly_Rate) {
      return res.status(400).json({ error: 'Hotel_ID, Room_Number, Room_Type, and Nightly_Rate are required' });
    }

    const [result] = await db.query(
      `INSERT INTO Room (Hotel_ID, Room_Number, Room_Type, Floor_Number, Capacity, Nightly_Rate, Sale_Rate, Room_Description, Availability_Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Hotel_ID,
        Room_Number,
        Room_Type,
        Floor_Number || 1,
        Capacity || 2,
        Nightly_Rate,
        Sale_Rate || null,
        Room_Description || null,
        Availability_Status || 'Available'
      ]
    );

    const [newRoom] = await db.query(
      `SELECT r.*, h.Hotel_Name FROM Room r JOIN Hotel h ON r.Hotel_ID = h.Hotel_ID WHERE r.Room_ID = ?`,
      [result.insertId]
    );
    res.status(201).json(newRoom[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Hotel_ID, Room_Number, Room_Type, Floor_Number, Capacity, Nightly_Rate, Sale_Rate, Room_Description, Availability_Status } = req.body;

    const [existing] = await db.query('SELECT * FROM Room WHERE Room_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await db.query(
      `UPDATE Room SET 
        Hotel_ID = ?, 
        Room_Number = ?, 
        Room_Type = ?, 
        Floor_Number = ?, 
        Capacity = ?, 
        Nightly_Rate = ?, 
        Sale_Rate = ?,
        Room_Description = ?,
        Availability_Status = ?
       WHERE Room_ID = ?`,
      [
        Hotel_ID || existing[0].Hotel_ID,
        Room_Number || existing[0].Room_Number,
        Room_Type || existing[0].Room_Type,
        Floor_Number !== undefined ? Floor_Number : existing[0].Floor_Number,
        Capacity !== undefined ? Capacity : existing[0].Capacity,
        Nightly_Rate !== undefined ? Nightly_Rate : existing[0].Nightly_Rate,
        Sale_Rate !== undefined ? Sale_Rate : existing[0].Sale_Rate,
        Room_Description !== undefined ? Room_Description : existing[0].Room_Description,
        Availability_Status || existing[0].Availability_Status,
        id
      ]
    );

    const [updated] = await db.query(
      `SELECT r.*, h.Hotel_Name FROM Room r JOIN Hotel h ON r.Hotel_ID = h.Hotel_ID WHERE r.Room_ID = ?`,
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Room WHERE Room_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await db.query('DELETE FROM Room WHERE Room_ID = ?', [id]);
    res.json({ message: 'Room deleted successfully', Room_ID: id });
  } catch (err) {
    next(err);
  }
};
