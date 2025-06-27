export interface Users {
  _id?: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  _id?: string;
  userId: string;
  userName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInTasks: Task[];
  checkOutTasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  description: string;
  status: "todo" | "done";
  timeRange?: string;
}

export interface AttendanceFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
