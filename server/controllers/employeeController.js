const db = require('../config/db');

exports.getAllEmployees = async (req, res, next) => {
  try {
    const [employees] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email, p.Address, p.Nationality,
             h.Hotel_Name
      FROM Employee e
      JOIN Person p ON e.Employee_ID = p.Person_ID
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      ORDER BY e.Employee_ID DESC
    `);
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [employees] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email, p.Address, p.Nationality,
             h.Hotel_Name
      FROM Employee e
      JOIN Person p ON e.Employee_ID = p.Person_ID
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [id]);

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employees[0]);
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { First_Name, Last_Name, Phone_Number, Email, Address, Nationality, Hotel_ID, Designation, Salary, Joining_Date, Employment_Status } = req.body;

    if (!First_Name || !Last_Name || !Phone_Number || !Hotel_ID || !Designation) {
      await connection.rollback();
      return res.status(400).json({ error: 'First Name, Last Name, Phone Number, Hotel, and Designation are required' });
    }

    // Insert Person
    const [personResult] = await connection.query(
      `INSERT INTO Person (First_Name, Last_Name, Phone_Number, Email, Address, Nationality)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [First_Name, Last_Name, Phone_Number, Email || null, Address || null, Nationality || null]
    );

    const personId = personResult.insertId;

    // Insert Employee referencing Person_ID
    await connection.query(
      `INSERT INTO Employee (Employee_ID, Hotel_ID, Designation, Salary, Joining_Date, Employment_Status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        personId,
        Hotel_ID,
        Designation,
        Salary || 0.00,
        Joining_Date || new Date().toISOString().split('T')[0],
        Employment_Status || 'Active'
      ]
    );

    await connection.commit();

    const [newEmp] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email, p.Address, p.Nationality,
             h.Hotel_Name
      FROM Employee e
      JOIN Person p ON e.Employee_ID = p.Person_ID
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [personId]);

    res.status(201).json(newEmp[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.updateEmployee = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { First_Name, Last_Name, Phone_Number, Email, Address, Nationality, Hotel_ID, Designation, Salary, Joining_Date, Employment_Status } = req.body;

    const [existing] = await connection.query('SELECT * FROM Employee WHERE Employee_ID = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update Person fields
    await connection.query(
      `UPDATE Person SET 
        First_Name = COALESCE(?, First_Name),
        Last_Name = COALESCE(?, Last_Name),
        Phone_Number = COALESCE(?, Phone_Number),
        Email = COALESCE(?, Email),
        Address = COALESCE(?, Address),
        Nationality = COALESCE(?, Nationality)
       WHERE Person_ID = ?`,
      [First_Name, Last_Name, Phone_Number, Email, Address, Nationality, id]
    );

    // Update Employee fields
    await connection.query(
      `UPDATE Employee SET
        Hotel_ID = COALESCE(?, Hotel_ID),
        Designation = COALESCE(?, Designation),
        Salary = COALESCE(?, Salary),
        Joining_Date = COALESCE(?, Joining_Date),
        Employment_Status = COALESCE(?, Employment_Status)
       WHERE Employee_ID = ?`,
      [Hotel_ID, Designation, Salary, Joining_Date, Employment_Status, id]
    );

    await connection.commit();

    const [updated] = await db.query(`
      SELECT e.Employee_ID, e.Hotel_ID, e.Designation, e.Salary, e.Joining_Date, e.Employment_Status,
             p.First_Name, p.Last_Name, p.Phone_Number, p.Email, p.Address, p.Nationality,
             h.Hotel_Name
      FROM Employee e
      JOIN Person p ON e.Employee_ID = p.Person_ID
      JOIN Hotel h ON e.Hotel_ID = h.Hotel_ID
      WHERE e.Employee_ID = ?
    `, [id]);

    res.json(updated[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM Employee WHERE Employee_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await db.query('DELETE FROM Person WHERE Person_ID = ?', [id]);
    res.json({ message: 'Employee deleted successfully', Employee_ID: id });
  } catch (err) {
    next(err);
  }
};
