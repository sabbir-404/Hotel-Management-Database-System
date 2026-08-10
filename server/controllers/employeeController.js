const db = require('../config/db');

const mapEmployeeFields = (e) => {
  if (!e) return e;
  const parts = (e.Full_Name || '').split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return {
    ...e,
    First_Name: e.First_Name || firstName,
    Last_Name: e.Last_Name || lastName,
    Role: e.Role || e.Designation || 'Receptionist'
  };
};

exports.getAllEmployees = async (req, res, next) => {
  try {
    const [employees] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Full_Name, e.Role, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             e.Phone_Number, e.Email, e.Username,
             h.Hotel_Name
      FROM Employee e
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      ORDER BY e.Employee_ID DESC
    `);
    res.json(employees.map(mapEmployeeFields));
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [employees] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Full_Name, e.Role, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             e.Phone_Number, e.Email, e.Username,
             h.Hotel_Name
      FROM Employee e
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [id]);

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(mapEmployeeFields(employees[0]));
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const { Full_Name, First_Name, Last_Name, Hotel_ID, Role, Designation, Salary, Joining_Date, Employment_Status, Phone_Number, Email, Username, Password } = req.body;

    const empFullName = Full_Name || `${First_Name || ''} ${Last_Name || ''}`.trim();
    const assignedRole = Role || Designation || 'Receptionist';
    const assignedDesignation = Designation || assignedRole;

    if (!empFullName || !Hotel_ID) {
      return res.status(400).json({ error: 'Full Name and Hotel assignment are required' });
    }

    if (Username) {
      const [existingUser] = await db.query('SELECT Employee_ID FROM Employee WHERE LOWER(Username) = LOWER(?)', [Username.trim()]);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username is already taken by another employee.' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO Employee (Hotel_ID, Full_Name, Role, Designation, Salary, Joining_Date, Employment_Status, Phone_Number, Email, Username, Password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Hotel_ID,
        empFullName,
        assignedRole,
        assignedDesignation,
        Salary || 0.00,
        Joining_Date || new Date().toISOString().split('T')[0],
        Employment_Status || 'Active',
        Phone_Number || null,
        Email || null,
        Username ? Username.trim() : null,
        Password ? Password.trim() : 'admin123'
      ]
    );

    const newEmpId = result.insertId;

    const [newEmp] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Full_Name, e.Role, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             e.Phone_Number, e.Email, e.Username,
             h.Hotel_Name
      FROM Employee e
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [newEmpId]);

    res.status(201).json(mapEmployeeFields(newEmp[0]));
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Full_Name, First_Name, Last_Name, Hotel_ID, Role, Designation, Salary, Joining_Date, Employment_Status, Phone_Number, Email, Username, Password } = req.body;

    const [existing] = await db.query('SELECT * FROM Employee WHERE Employee_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const empFullName = Full_Name || (First_Name || Last_Name ? `${First_Name || ''} ${Last_Name || ''}`.trim() : null);

    if (Username) {
      const [existingUser] = await db.query('SELECT Employee_ID FROM Employee WHERE LOWER(Username) = LOWER(?) AND Employee_ID != ?', [Username.trim(), id]);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username is already taken by another employee.' });
      }
    }

    await db.query(
      `UPDATE Employee SET
        Hotel_ID = COALESCE(?, Hotel_ID),
        Full_Name = COALESCE(?, Full_Name),
        Role = COALESCE(?, Role),
        Designation = COALESCE(?, Designation),
        Salary = COALESCE(?, Salary),
        Joining_Date = COALESCE(?, Joining_Date),
        Employment_Status = COALESCE(?, Employment_Status),
        Phone_Number = COALESCE(?, Phone_Number),
        Email = COALESCE(?, Email),
        Username = COALESCE(?, Username),
        Password = COALESCE(?, Password)
       WHERE Employee_ID = ?`,
      [
        Hotel_ID,
        empFullName,
        Role,
        Designation || Role,
        Salary,
        Joining_Date,
        Employment_Status,
        Phone_Number,
        Email,
        Username ? Username.trim() : null,
        Password ? Password.trim() : null,
        id
      ]
    );

    const [updated] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Full_Name, e.Role, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             e.Phone_Number, e.Email, e.Username,
             h.Hotel_Name
      FROM Employee e
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [id]);

    res.json(mapEmployeeFields(updated[0]));
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Employee WHERE Employee_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await db.query('DELETE FROM Employee WHERE Employee_ID = ?', [id]);
    res.json({ message: 'Employee deleted successfully', Employee_ID: id });
  } catch (err) {
    next(err);
  }
};
