const db = require('../config/db');

exports.getAllHotels = async (req, res, next) => {
  try {
    const [hotels] = await db.query(`
      SELECT h.*, 
             COUNT(DISTINCT r.Room_ID) as Total_Rooms,
             COUNT(DISTINCT e.Employee_ID) as Total_Employees
      FROM Hotel h
      LEFT JOIN Room r ON h.Hotel_ID = r.Hotel_ID
      LEFT JOIN Employee e ON h.Hotel_ID = e.Hotel_ID
      GROUP BY h.Hotel_ID
      ORDER BY h.Hotel_ID ASC
    `);
    res.json(hotels);
  } catch (err) {
    next(err);
  }
};

exports.getHotelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [hotels] = await db.query('SELECT * FROM Hotel WHERE Hotel_ID = ?', [id]);
    if (hotels.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const [rooms] = await db.query('SELECT * FROM Room WHERE Hotel_ID = ?', [id]);
    res.json({ ...hotels[0], rooms });
  } catch (err) {
    next(err);
  }
};

exports.createHotel = async (req, res, next) => {
  try {
    const { Hotel_Name, Address, City, Contact_Number, Star_Rating, Image_Url } = req.body;
    if (!Hotel_Name) {
      return res.status(400).json({ error: 'Hotel Name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO Hotel (Hotel_Name, Address, City, Contact_Number, Star_Rating, Image_Url) VALUES (?, ?, ?, ?, ?, ?)',
      [
        Hotel_Name,
        Address || null,
        City || 'Dhaka',
        Contact_Number || null,
        Star_Rating || 4,
        Image_Url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      ]
    );

    const [newHotel] = await db.query('SELECT * FROM Hotel WHERE Hotel_ID = ?', [result.insertId]);
    res.status(201).json(newHotel[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Hotel_Name, Address, City, Contact_Number, Star_Rating, Image_Url } = req.body;

    const [existing] = await db.query('SELECT * FROM Hotel WHERE Hotel_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    await db.query(
      'UPDATE Hotel SET Hotel_Name = ?, Address = ?, City = ?, Contact_Number = ?, Star_Rating = ?, Image_Url = ? WHERE Hotel_ID = ?',
      [
        Hotel_Name || existing[0].Hotel_Name,
        Address !== undefined ? Address : existing[0].Address,
        City !== undefined ? City : existing[0].City,
        Contact_Number !== undefined ? Contact_Number : existing[0].Contact_Number,
        Star_Rating !== undefined ? Star_Rating : existing[0].Star_Rating,
        Image_Url !== undefined ? Image_Url : existing[0].Image_Url,
        id
      ]
    );

    const [updated] = await db.query('SELECT * FROM Hotel WHERE Hotel_ID = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

exports.deleteHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Hotel WHERE Hotel_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    await db.query('DELETE FROM Hotel WHERE Hotel_ID = ?', [id]);
    res.json({ message: 'Hotel deleted successfully', Hotel_ID: id });
  } catch (err) {
    next(err);
  }
};
