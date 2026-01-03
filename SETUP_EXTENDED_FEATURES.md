# HRMS System - Extended Features Setup Guide

## Overview
The HRMS system has been extended with the following new features:
1. ✅ Employee Document Management
2. ✅ Limited Profile Edit for Employees
3. ✅ Weekly Attendance View
4. ✅ Half-Day Attendance Status
5. ✅ Leave Remarks & Approval Comments
6. ✅ Payroll Reports & Salary Slip View

## IMPORTANT: Database Update Required

Before testing the new features, you MUST apply the database schema updates:

### Step 1: Apply Database Schema Updates

1. Open PowerShell or Command Prompt
2. Navigate to MySQL bin directory or make sure MySQL is in your PATH
3. Run the following commands:

```powershell
# Login to MySQL
mysql -u root -p
# Enter password: Akshat#151105

# Use the database
use hrms;

# Run the schema updates
source D:/Odoo/hrms-backend/config/schema-updates.sql;

# Exit MySQL
exit;
```

**Alternative method (PowerShell one-liner):**
```powershell
Get-Content "D:\Odoo\hrms-backend\config\schema-updates.sql" | mysql -u root -p"Akshat#151105" hrms
```

### Step 2: Restart Backend Server

After applying the database updates:
1. Stop the backend server (Ctrl+C in the terminal)
2. Restart it:
```powershell
cd D:\Odoo\hrms-backend
node server.js
```

### Step 3: Restart Frontend (if needed)

The frontend server should automatically reload, but if not:
1. Stop the frontend server (Ctrl+C in the terminal)
2. Restart it:
```powershell
cd D:\Odoo\hrms-frontend
npm start
```

## New Features Guide

### 1. Document Management

**Location:** http://localhost:3001/documents

**Features:**
- Upload documents (Salary Slip, Certificate, Profile Picture, Other)
- Download documents
- Delete documents
- Role-based access (employees see only their documents, admins see all)

**Usage:**
1. Navigate to "Documents" in the header menu
2. Click "Upload Document" button
3. Select document type and file
4. Click Upload
5. View, download, or delete documents from the table

### 2. Limited Profile Edit

**Location:** http://localhost:3001/profile

**Features:**
- Employees can edit only: Address, Mobile, Personal Email
- Admins can view all profile information
- Edit button appears on Personal Info tab

**Usage (Employee):**
1. Navigate to Profile → Personal Info tab
2. Click "Edit Profile" button
3. Modify Address, Mobile, or Personal Email
4. Click "Save Changes" or "Cancel"

### 3. Weekly Attendance View

**Location:** http://localhost:3001/attendance

**Features:**
- Toggle between Daily and Weekly views
- Weekly view shows:
  - Week numbers
  - Present days per week
  - Total hours per week
  - Extra hours per week
  - Half days per week

**Usage:**
1. Navigate to Attendance
2. Click "Weekly View" button
3. View aggregated attendance data by week
4. Switch back to "Daily View" to see individual records

### 4. Half-Day Attendance Status

**Automatic Detection:**
- If work hours < 4 hours → marked as Half Day
- Payable days calculated as 0.5 for half days
- Displayed in both Daily and Weekly views

**View Half Days:**
1. Navigate to Attendance (Daily View)
2. "Half Day" column shows "Yes" or "No"
3. Summary cards show total half days count

### 5. Leave Remarks & Approval Comments

**Location:** http://localhost:3001/leave

**Features:**
- Employees can add remarks when requesting leave
- Admins can add comments when approving/rejecting
- Both remarks and comments visible in table

**Usage (Employee):**
1. Click "Request Leave"
2. Fill in details
3. Add optional remarks in "Remarks" field
4. Submit

**Usage (Admin):**
1. View pending leaves
2. Click "Approve" - prompted for optional comment
3. Click "Reject" - required to provide rejection reason
4. Comments appear in "Comment" column

### 6. Payroll Reports & Salary Slip

#### Payroll Reports (Admin Only)
**Location:** http://localhost:3001/payroll

**Features:**
- Generate payroll for selected month/year
- View all employees' payroll data
- Approve payroll records
- Automatic calculation based on attendance

**Usage:**
1. Navigate to Payroll
2. Select month and year
3. Click "Generate Payroll" button
4. Review payroll data in table
5. Approve individual payroll records

**Payroll Calculation:**
- Present Days + Paid Leave Days = Payable Days
- Pro-rated salary = (Basic Salary / Total Days) × Payable Days
- Gross Salary = Basic + HRA + Allowances
- Net Salary = Gross Salary - Deductions

#### Salary Slip (All Users)
**Location:** http://localhost:3001/salary-slip or Profile dropdown

**Features:**
- View detailed salary breakdown
- Attendance summary
- Earnings and deductions breakdown
- Print-friendly format
- Employees see only their own slips

**Usage:**
1. Navigate to Salary Slip from header dropdown
2. Select month and year
3. View detailed salary information
4. Click "Print Slip" to print or save as PDF

## Testing Checklist

### Document Management
- [ ] Upload a document (Salary Slip type)
- [ ] Download the uploaded document
- [ ] Delete a document
- [ ] Verify employee sees only their documents
- [ ] Verify admin sees all documents

### Profile Edit
- [ ] Login as employee
- [ ] Click Edit Profile
- [ ] Modify Address
- [ ] Modify Mobile
- [ ] Modify Personal Email
- [ ] Verify cannot edit other fields
- [ ] Save changes successfully

### Attendance - Half Day & Weekly View
- [ ] Check in with < 4 hours work
- [ ] Verify "Half Day" shows "Yes"
- [ ] Verify Payable Days shows 0.5
- [ ] Switch to Weekly View
- [ ] Verify weekly aggregation correct
- [ ] Verify half days count in summary

### Leave - Remarks & Comments
- [ ] Create leave request with remarks
- [ ] Verify remarks appear in table
- [ ] Login as admin
- [ ] Approve leave with comment
- [ ] Verify approval comment appears
- [ ] Reject leave with reason
- [ ] Verify rejection reason appears

### Payroll Reports
- [ ] Login as admin
- [ ] Navigate to Payroll
- [ ] Generate payroll for current month
- [ ] Verify all employees listed
- [ ] Verify calculations correct
- [ ] Approve a payroll record
- [ ] Verify status changes to "approved"

### Salary Slip
- [ ] Navigate to Salary Slip
- [ ] Select month with payroll data
- [ ] Verify all sections display correctly:
  - Employee details
  - Attendance summary
  - Earnings breakdown
  - Deductions breakdown
  - Net salary
- [ ] Test print functionality
- [ ] Verify employee sees only own slip

## Troubleshooting

### Error: "Table 'employee_documents' doesn't exist"
**Solution:** Database schema not applied. Follow Step 1 above.

### Error: "Column 'remarks' not found"
**Solution:** Database schema not applied. Follow Step 1 above.

### Document upload fails
**Solution:** Check that `uploads/documents/` and `uploads/profile-pictures/` directories exist. Backend creates them automatically on startup.

### Payroll generation fails
**Solution:** Ensure:
1. Employees have salary_info records
2. Attendance data exists for the selected month
3. Database schema is applied (payroll table exists)

### Cannot edit profile fields
**Solution:** 
1. Check role - employees can only edit 3 fields
2. Verify you clicked "Edit Profile" button
3. Check backend validation in console

### Weekly view shows empty
**Solution:** Ensure attendance records exist for current month. Check-in/out to create records.

## Database Schema Changes

The `schema-updates.sql` file adds:

1. **employee_documents** table
   - Stores uploaded documents with metadata
   - Links documents to employees

2. **payroll** table
   - Stores monthly payroll records
   - Includes salary breakdown and deductions
   - Tracks approval status

3. **attendance** table updates
   - Added `is_half_day` column (BOOLEAN)
   - Added `payable_days` column (DECIMAL)

4. **leave_requests** table updates
   - Added `remarks` column (TEXT)
   - Added `approval_comment` column (TEXT)

## API Endpoints Added

### Document Management
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Payroll
- `POST /api/payroll/generate` - Generate payroll (Admin only)
- `GET /api/payroll/salary-slip` - Get salary slip
- `GET /api/payroll/reports` - Get payroll reports (Admin only)
- `PUT /api/payroll/:id/approve` - Approve payroll (Admin only)

### Updated Endpoints
- `GET /api/attendance/my-attendance?view=weekly` - Get weekly attendance
- `POST /api/leave/requests` - Now accepts remarks field
- `PUT /api/leave/:id/status` - Now accepts approval_comment field
- `PUT /api/employees/:id` - Field validation based on role

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend terminal for API errors
3. Verify database schema applied correctly
4. Ensure both servers are running
5. Check file permissions for uploads directory

## Next Steps

1. ✅ Apply database updates (CRITICAL)
2. ✅ Test all new features systematically
3. ✅ Add test employees and data if needed
4. ✅ Generate sample payroll data
5. ✅ Test role-based access control
6. ✅ Verify all calculations correct

Enjoy your fully-featured HRMS system!
