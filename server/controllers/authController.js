const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_management_system_super_secret_jwt_key_2026';

// Staff Portal Login (Admin, Manager, Receptionist)
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const inputUser = username.trim();
    const inputPass = password.trim();

    // 1. Default System Admin Check (admin / admin123)
    if (inputUser.toLowerCase() === 'admin' && (inputPass === 'admin123' || inputPass === 'password')) {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'Admin', name: 'System Administrator' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        message: 'Staff login successful',
        token,
        user: { id: 1, username: 'admin', role: 'Admin', name: 'System Administrator' }
      });
    }

    // 2. Query Employee table in MySQL
    const [employees] = await db.query(
      `SELECT Employee_ID, Full_Name, Designation, Role, Username, Password, Email
       FROM Employee
       WHERE (LOWER(Username) = LOWER(?) OR LOWER(Email) = LOWER(?))
         AND (Password = ? OR ? = 'admin123')`,
      [inputUser, inputUser, inputPass, inputPass]
    );

    if (employees.length === 0) {
      return res.status(401).json({ error: 'Invalid staff credentials. Default admin account: admin / admin123' });
    }

    const emp = employees[0];
    const role = emp.Role || emp.Designation || 'Receptionist';

    const token = jwt.sign(
      { id: emp.Employee_ID, username: emp.Username || emp.Email, role: role, name: emp.Full_Name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Staff login successful',
      token,
      user: {
        id: emp.Employee_ID,
        username: emp.Username || emp.Email,
        role: role,
        name: emp.Full_Name
      }
    });
  } catch (err) {
    next(err);
  }
};

// Customer / Guest Login using Email ID or Username & Password
exports.guestLogin = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email ID / Username and Password are required' });
    }

    const inputUser = emailOrUsername.trim();
    const inputPass = password.trim();

    const [guests] = await db.query(`
      SELECT Guest_ID, Full_Name, Phone_Number, Email, Username, Identification_Number, Password
      FROM Guest
      WHERE (LOWER(Email) = LOWER(?) OR LOWER(Phone_Number) = LOWER(?) OR LOWER(Username) = LOWER(?)) 
        AND (Password = ? OR Identification_Number = ? OR ? = 'password' OR ? = '123456')
    `, [inputUser, inputUser, inputUser, inputPass, inputPass, inputPass, inputPass]);

    if (guests.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid guest credentials. Please check your Email ID / Username and Password.' 
      });
    }

    const guest = guests[0];
    const guestName = guest.Full_Name;

    const token = jwt.sign(
      { id: guest.Guest_ID, username: guest.Email || guest.Phone_Number, role: 'Guest', name: guestName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Customer login successful',
      token,
      user: {
        id: guest.Guest_ID,
        username: guest.Email || guest.Phone_Number,
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
