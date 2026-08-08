export type UserRole = 'Admin' | 'Receptionist' | 'Manager' | 'Guest';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  name: string;
}

export interface Hotel {
  Hotel_ID: number;
  Hotel_Name: string;
  Address?: string;
  City?: string;
  Contact_Number?: string;
  Star_Rating?: number;
  Image_Url?: string;
  Total_Rooms?: number;
  Total_Employees?: number;
}

export interface Room {
  Room_ID: number;
  Hotel_ID: number;
  Hotel_Name?: string;
  Room_Number: string;
  Room_Type: 'Single' | 'Double' | 'Suite' | 'Deluxe';
  Floor_Number: number;
  Capacity: number;
  Nightly_Rate: number | string;
  Sale_Rate?: number | string;
  Room_Description?: string;
  Availability_Status: 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';
}

export interface Guest {
  Guest_ID: number;
  Full_Name?: string;
  First_Name: string;
  Last_Name: string;
  Phone_Number: string;
  Email?: string;
  Address?: string;
  Nationality?: string;
  Registration_Date?: string;
  Identification_Number: string;
  Username?: string;
  Password?: string;
  Total_Reservations?: number;
}

export interface Employee {
  Employee_ID: number;
  Hotel_ID: number;
  Hotel_Name?: string;
  Full_Name?: string;
  First_Name: string;
  Last_Name: string;
  Phone_Number?: string;
  Email?: string;
  Address?: string;
  Nationality?: string;
  Designation: string;
  Salary: number | string;
  Joining_Date?: string;
  Employment_Status: 'Active' | 'Inactive' | 'On Leave';
  Password?: string;
}

export interface Reservation {
  Reservation_ID: number;
  Guest_ID: number;
  Room_ID: number;
  Full_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Phone_Number?: string;
  Email?: string;
  Room_Number?: string;
  Room_Type?: string;
  Nightly_Rate?: number | string;
  Hotel_Name?: string;
  Hotel_ID?: number;
  Booking_Date: string;
  Check_In_Date: string;
  Check_Out_Date: string;
  Reservation_Status: 'Pending' | 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled';
  Number_of_Guests: number;
  Total_Nights?: number;
  Room_Charge?: number;
  Bill_ID?: number;
  Payment_Status?: string;
}

export interface Service {
  Service_ID: number;
  Service_Type?: string;
  Service_Name: string;
  Service_Charge?: number | string;
  Service_Description?: string;
}

export interface ServiceRecord {
  Service_Record_ID: number;
  Guest_ID: number;
  Service_ID: number;
  Bill_ID?: number;
  Service_Type?: string;
  Service_Name?: string;
  Full_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Service_Date: string;
  Quantity: number;
  Charge: number | string;
}

export interface BillItem {
  Bill_ID: number;
  Bill_Item_No?: number;
  Service_Record_ID?: number;
  Service_Type?: string;
  Service_Name?: string;
  Service_Date?: string;
  Quantity: number;
  Charge: number | string;
}

export interface Bill {
  Bill_ID: number;
  Reservation_ID: number;
  Billing_Date?: string;
  Total_Amount: number | string;
  Taxes: number | string;
  Discounts: number | string;
  Final_Amount: number | string;
  Payment_Method?: 'Cash' | 'Card' | 'Mobile Banking' | 'Bank Transfer';
  Payment_Status: 'Pending' | 'Paid' | 'Cancelled';
  Full_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone_Number?: string;
  Room_Number?: string;
  Room_Type?: string;
  Hotel_Name?: string;
  City?: string;
  Hotel_Contact?: string;
  Total_Nights?: number;
  Nightly_Rate?: number | string;
  Check_In_Date?: string;
  Check_Out_Date?: string;
  items?: ServiceRecord[] | BillItem[];
}

export interface DashboardSummary {
  totalHotels: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  activeReservations: number;
  guestsToday: number;
  todayRevenue: number | string;
  monthlyRevenue: number | string;
  occupancyRate: number;
}
