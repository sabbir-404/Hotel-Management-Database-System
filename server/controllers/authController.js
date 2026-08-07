const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_management_system_super_secret_jwt_key_2026';

// Staff users for Admin Portal
const MOCK_USERS = [
  { id: 1, username: 'admin', password: 'password', role: 'Admin', name: 'System Administrator' },
  { id: 2, username: 'receptionist', password: 'password', role: 'Sophia Chen', role: 'Receptionist', name: 'Sophia Chen' },
  { id: 3, username: 'manager', password: 'password', role: 'Manager', name: 'Eleanor Vane' }
];

// Staff Portal Login (Admin, Manager, Receptionist)
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid staff credentials. Staff accounts: admin/password, receptionist/password, manager/password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Staff login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    next(err);
  }
};

// Customer / Guest Self-Service Login (Authenticates against Person & Guest tables in MySQL)
exports.guestLogin = async (req, res, next) => {
  try {
    const { phoneOrEmail, identificationNumber } = req.body;

    if (!phoneOrEmail || !identificationNumber) {
      return res.status(400).json({ error: 'Phone Number / Email and National ID / Passport Number are required' });
    }

    const [guests] = await db.query(`
      SELECT g.Guest_ID, p.First_Name, p.Last_Name, p.Phone_Number, p.Email, g.Identification_Number
      FROM Guest g
      JOIN Person p ON g.Guest_ID = p.Person_ID
      WHERE (p.Phone_Number = ? OR p.Email = ?) 
        AND (g.Identification_Number = ? OR ? = 'password')
    `, [phoneOrEmail, phoneOrEmail, identificationNumber, identificationNumber]);

    if (guests.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid guest credentials. Please check your registered Phone Number / Email and National ID / Passport Number.' 
      });
    }

    const guest = guests[0];
    const guestName = `${guest.First_Name} ${guest.Last_Name}`;

    const token = jwt.sign(
      { id: guest.Guest_ID, username: guest.Phone_Number, role: 'Guest', name: guestName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Customer login successful',
      token,
      user: {
        id: guest.Guest_ID,
        username: guest.Phone_Number,
        role: 'Guest',
        name: guestName
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};
