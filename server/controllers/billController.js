const db = require('../config/db');

exports.getAllBills = async (req, res, next) => {
  try {
    const [bills] = await db.query(`
      SELECT b.*, 
             r.Check_In_Date, r.Check_Out_Date, r.Guest_ID,
             p.First_Name, p.Last_Name, p.Email, p.Phone_Number,
             rm.Room_Number, rm.Room_Type, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      ORDER BY b.Bill_ID DESC
    `);
    res.json(bills);
  } catch (err) {
    next(err);
  }
};

exports.getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [bills] = await db.query(`
      SELECT b.*, 
             r.Check_In_Date, r.Check_Out_Date, r.Guest_ID, r.Booking_Date,
             p.First_Name, p.Last_Name, p.Email, p.Phone_Number, p.Address, g.Identification_Number,
             rm.Room_Number, rm.Room_Type, rm.Nightly_Rate, h.Hotel_Name, h.City, h.Contact_Number as Hotel_Contact,
             DATEDIFF(r.Check_Out_Date, r.Check_In_Date) as Total_Nights
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE b.Bill_ID = ?
    `, [id]);

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = bills[0];

    // Fetch bill items
    const [items] = await db.query(`
      SELECT bi.*, s.Service_Name, sr.Service_Date
      FROM Bill_Item bi
      LEFT JOIN Service_Record sr ON bi.Service_Record_ID = sr.Service_Record_ID
      LEFT JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE bi.Bill_ID = ?
      ORDER BY bi.Bill_Item_No ASC
    `, [id]);

    res.json({ ...bill, items });
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

    // Get all service records for this guest
    const [serviceRecords] = await connection.query(`
      SELECT sr.*, s.Service_Name
      FROM Service_Record sr
      JOIN Service s ON sr.Service_ID = s.Service_ID
      WHERE sr.Guest_ID = ?
    `, [reservation.Guest_ID]);

    let totalServiceCharge = 0;
    serviceRecords.forEach(sr => {
      totalServiceCharge += parseFloat(sr.Charge || 0);
    });

    const subtotal = roomCharge + totalServiceCharge;
    const taxAmount = Taxes !== undefined ? parseFloat(Taxes) : Math.round(subtotal * 0.10 * 100) / 100; // default 10% tax
    const discountAmount = Discounts !== undefined ? parseFloat(Discounts) : 0;
    const finalAmount = subtotal + taxAmount - discountAmount;
    const billingDate = new Date().toISOString().split('T')[0];

    // Insert into Bill (trg_bill_total trigger automatically computes Final_Amount if needed)
    const [billResult] = await connection.query(
      `INSERT INTO Bill (Reservation_ID, Billing_Date, Total_Amount, Taxes, Discounts, Final_Amount, Payment_Method, Payment_Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid')`,
      [
        Reservation_ID,
        billingDate,
        subtotal,
        taxAmount,
        discountAmount,
        finalAmount,
        Payment_Method || 'Card'
      ]
    );

    const billId = billResult.insertId;

    // Populate Bill_Items for each Service_Record
    let itemNo = 1;
    for (const sr of serviceRecords) {
      await connection.query(
        `INSERT INTO Bill_Item (Bill_ID, Bill_Item_No, Service_Record_ID, Quantity, Charge)
         VALUES (?, ?, ?, ?, ?)`,
        [billId, itemNo++, sr.Service_Record_ID, sr.Quantity, sr.Charge]
      );
    }

    // Automatically check out guest if reservation was Checked In
    await connection.query(`UPDATE Reservation SET Reservation_Status = 'Checked Out' WHERE Reservation_ID = ?`, [Reservation_ID]);
    await connection.query(`UPDATE Room SET Availability_Status = 'Available' WHERE Room_ID = ?`, [reservation.Room_ID]);

    await connection.commit();

    // Fetch complete bill details
    const [newBill] = await db.query(`
      SELECT b.*, r.Check_In_Date, r.Check_Out_Date, p.First_Name, p.Last_Name, rm.Room_Number, h.Hotel_Name
      FROM Bill b
      JOIN Reservation r ON b.Reservation_ID = r.Reservation_ID
      JOIN Guest g ON r.Guest_ID = g.Guest_ID
      JOIN Person p ON g.Guest_ID = p.Person_ID
      JOIN Room rm ON r.Room_ID = rm.Room_ID
      JOIN Hotel h ON rm.Hotel_ID = h.Hotel_ID
      WHERE b.Bill_ID = ?
    `, [billId]);

    res.status(201).json(newBill[0]);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};
