-- MongoDB Collections Setup
-- This is a reference for the collections structure

-- Users Collection
{
  "_id": ObjectId,
  "email": String (unique),
  "name": String,
  "password": String (hashed),
  "createdAt": Date
}

-- Attendance Collection
{
  "_id": ObjectId,
  "userId": String,
  "userName": String,
  "date": String (YYYY-MM-DD),
  "checkInTime": String (HH:MM),
  "checkOutTime": String (HH:MM),
  "checkInTasks": [
    {
      "id": String,
      "description": String,
      "status": "todo"
    }
  ],
  "checkOutTasks": [
    {
      "id": String,
      "description": String,
      "status": "done",
      "timeRange": String (optional)
    }
  ],
  "createdAt": Date,
  "updatedAt": Date
}

-- Indexes for better performance
-- db.users.createIndex({ "email": 1 }, { unique: true })
-- db.attendance.createIndex({ "userId": 1, "date": -1 })
-- db.attendance.createIndex({ "checkInTasks.description": "text", "checkOutTasks.description": "text" })
