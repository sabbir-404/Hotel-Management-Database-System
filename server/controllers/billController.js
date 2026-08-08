const db = require('../config/db');

const mapBillFields = (b) => {
  if (!b) return b;
  const parts = (b.Full_Name || '').split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const total = parseFloat(b.Total_Amount || 0);
  const taxes = parseFloat(b.Taxes || 0);
  const discounts = parseFloat(b.Discounts || 0);
  const finalAmt = total + taxes - discounts;
  return {
    ...b,
    First_Name: b.First_Name || firstName,
    Last_Name: b.Last_Name || lastName,
    Final_Amount: finalAmt
  };
};

exports.getAllBills = async (req, res, next) => {
  try {
    const [bills] = await db.query(`
      SELECT b.*, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount,
             r.Check_In_Date, r.Check_Out_Date, r.Guest_ID,
             g.Full_Name, g.Email, g.Phone_Number,
             rm.Room_Number, rm.Room_Type, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      ORDER BY b.Bill_ID DESC
    `);
    res.json(bills.map(mapBillFields));
  } catch (err) {
    next(err);
  }
};

exports.getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [bills] = await db.query(`
      SELECT b.*, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount,
             r.Check_In_Date, r.Check_Out_Date, r.Guest_ID, r.Booking_Date,
             g.Full_Name, g.Email, g.Phone_Number, g.Address, g.Identification_Number,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate, h.Hotel_Name, h.City, h.Contact_Number as Hotel_Contact,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE b.Bill_ID = ?
    `, [id]);

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = mapBillFields(bills[0]);

    // Fetch service records linked directly to this Bill_ID
    const [items] = await db.query(`
      SELECT sr.*, s.Service_Type, COALESCE(s.Service_Name, s.Service_Type) as Service_Name, sr.Service_Date
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE sr.Bill_ID = ?
      ORDER BY sr.Service_Record_ID ASC
    `, [id]);

    res.json({ ...bill, items });
  } catch (err) {
    next(err);
  }
};

exports.updateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Payment_Status, Payment_Method, Discounts, Taxes, Total_Amount } = req.body;

    const [existing] = await db.query('SELECT * FROM Bill WHERE Bill_ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Bill record not found' });
    }

    await db.query(
      `UPDATE Bill SET
        Payment_Status = COALESCE(?, Payment_Status),
        Payment_Method = COALESCE(?, Payment_Method),
        Discounts = COALESCE(?, Discounts),
        Taxes = COALESCE(?, Taxes),
        Total_Amount = COALESCE(?, Total_Amount)
       WHERE Bill_ID = ?`,
      [
        Payment_Status || null,
        Payment_Method || null,
        Discounts !== undefined ? Discounts : null,
        Taxes !== undefined ? Taxes : null,
        Total_Amount !== undefined ? Total_Amount : null,
        id
      ]
    );

    const [updated] = await db.query(`
      SELECT b.*, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount,
             r.Check_In_Date, r.Check_Out_Date, r.Guest_ID,
             g.Full_Name, g.Email, g.Phone_Number,
             rm.Room_Number, rm.Room_Type, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE b.Bill_ID = ?
    `, [id]);

    res.json(mapBillFields(updated[0]));
  } catch (err) {
    next(err);
  }
};

exports.generateBill = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { Reservation_ID, Payment_Method, Taxes, Discounts } = req.body;

    if (!Reservation_ID) {
      await connection.rollback();
      return res.status(400).json({ error: 'Reservation ID is required' });
    }

    // Check if bill already exists for this reservation
    const [existing] = await connection.query('SELECT * FROM Bill WHERE Reservation_ID = ?', [Reservation_ID]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Bill already generated for this reservation', Bill_ID: existing[0].Bill_ID });
    }

    // Get Reservation details
    const [resDetails] = await connection.query(`
      SELECT r.*, rm.Nightly_Rate, DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights
      FROM Reservation r
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      WHERE r.Reservation_ID = ?
    `, [Reservation_ID]);

    if (resDetails.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = resDetails[0];
    const nights = Math.max(1, reservation.Total_Nights || 1);
    const roomCharge = parseFloat(reservation.Nightly_Rate) * nights;

    // Get all unbilled service records for this guest
    const [serviceRecords] = await connection.query(`
      SELECT sr.*, s.Service_Type
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE sr.Guest_ID = ? AND (sr.Bill_ID IS NULL OR sr.Bill_ID = 0)
    `, [reservation.Guest_ID]);

    let totalServiceCharge = 0;
    serviceRecords.forEach(sr => {
      totalServiceCharge += parseFloat(sr.Charge || sr.Total_Cost || 0);
    });

    const subtotal = roomCharge + totalServiceCharge;
    const taxAmount = Taxes !== undefined ? parseFloat(Taxes) : 0;
    const discountAmount = Discounts !== undefined ? parseFloat(Discounts) : 0;

    // Insert into Bill
    const [billResult] = await connection.query(
      `INSERT INTO Bill (Reservation_ID, Total_Amount, Taxes, Discounts, Payment_Method, Payment_Status)
       VALUES (?, ?, ?, ?, ?, 'Paid')`,
      [
        Reservation_ID,
        subtotal,
        taxAmount,
        discountAmount,
        Payment_Method || 'Card'
      ]
    );

    const billId = billResult.insertId;

    // Link Service_Record to this Bill_ID
    if (serviceRecords.length > 0) {
      await connection.query(
        `UPDATE Service_Record SET Bill_ID = ? WHERE Guest_ID = ? AND (Bill_ID IS NULL OR Bill_ID = 0)`,
        [billId, reservation.Guest_ID]
      );
    }

    // Automatically check out guest
    await connection.query(`UPDATE Reservation SET Reservation_Status = 'Checked Out' WHERE Reservation_ID = ?`, [Reservation_ID]);
    await connection.query(`UPDATE Room SET Availability_Status = 'Available' WHERE Room_ID = ?`, [reservation.Room_ID]);

    await connection.commit();

    // Fetch complete bill details
    const [newBill] = await db.query(`
      SELECT b.*, (b.Total_Amount + b.Taxes - b.Discounts) as Final_Amount,
             r.Check_In_Date, r.Check_Out_Date, g.Full_Name, rm.Room_Number, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE b.Bill_ID = ?
    `, [billId]);

    res.json(mapBillFields(newBill[0]));
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};
