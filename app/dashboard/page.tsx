"use client";

import type React from "react";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  LogOut,
  Search,
  User,
  Edit,
  Trash2,
  Copy,
  MessageCircle,
  Plus,
} from "lucide-react";
import type { AttendanceRecord, Task, Users } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<Users>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [editTasks, setEditTasks] = useState<Task[]>([]);
  const [editType, setEditType] = useState<"checkin" | "checkout">("checkin");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskTimeRange, setNewTaskTimeRange] = useState("");
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, startDate, endDate]);

  useEffect(() => {
    if (user) {
      fetchAttendanceRecords();
    }
  }, [
    fetchAttendanceRecords,
    user,
    search,
    startDate,
    endDate,
    pagination.page,
  ]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAttendanceRecords();
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?"))
      return;

    try {
      const response = await fetch(`/api/attendance/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAttendanceRecords();
      } else {
        alert("Failed to delete record");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert("An error occurred while deleting");
    }
  };

  const handleEdit = (
    record: AttendanceRecord,
    type: "checkin" | "checkout"
  ) => {
    setEditingRecord(record);
    setEditType(type);
    setEditTasks(
      type === "checkin" ? [...record.checkInTasks] : [...record.checkOutTasks]
    );
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const response = await fetch(`/api/attendance/${editingRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          tasks: editTasks,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingRecord(null);
        setEditTasks([]);
        fetchAttendanceRecords();
      } else {
        alert("Failed to update record");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert("An error occurred while updating");
    }
  };

  const addEditTask = () => {
    if (!newTaskDescription.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      description: newTaskDescription.trim(),
      status: editType === "checkin" ? "todo" : "done",
      timeRange:
        editType === "checkout" && newTaskTimeRange.trim()
          ? newTaskTimeRange.trim()
          : undefined,
    };

    setEditTasks([...editTasks, newTask]);
    setNewTaskDescription("");
    setNewTaskTimeRange("");
  };

  const removeEditTask = (taskId: string) => {
    setEditTasks(editTasks.filter((task) => task.id !== taskId));
  };

  const copyToClipboard = async (
    record: AttendanceRecord,
    type: "checkin" | "checkout"
  ) => {
    const tasks =
      type === "checkin" ? record.checkInTasks : record.checkOutTasks;
    const status = type === "checkin" ? "Incomplete" : "Complete";
    const badge = type === "checkin" ? "todo" : "done";

    let text = `dailyreport\n${record.userName}\n\n${status}:\n`;
    tasks.forEach((task) => {
      text += `[${badge}] ${task.description}`;
      if (task.timeRange) text += ` (${task.timeRange})`;
      text += "\n";
    });

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to copy to clipboard");
    }
  };

  const shareToWhatsApp = (
    record: AttendanceRecord,
    type: "checkin" | "checkout"
  ) => {
    const tasks =
      type === "checkin" ? record.checkInTasks : record.checkOutTasks;
    const status = type === "checkin" ? "Incomplete" : "complete";
    const badge = type === "checkin" ? "todo" : "done";

    let message = "";

    if (type === "checkin") {
      // Special format for checkin with date
      message = `dailyreport\n${record.userName}\n\n${status}:\n`;
    } else {
      message = `dailyreport\n${record.userName}\n\n${status}\n`;
    }

    tasks.forEach((task) => {
      message += `[${badge}] ${task.description}`;
      if (task.timeRange) message += ` (${task.timeRange})`;
      message += "\n";
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Attendance Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/checkin")}
              >
                Check In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/checkout")}
              >
                Check Out
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Records</CardTitle>
            <CardDescription>
              Search and filter your attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Tasks</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search task descriptions..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit">Apply Filters</Button>
            </form>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Check In Tasks</TableHead>
                      <TableHead>Check Out Tasks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {record.checkInTime ? (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{record.checkInTime}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOutTime ? (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{record.checkOutTime}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            {record.checkInTasks.length === 0 ? (
                              <span className="text-gray-400">No tasks</span>
                            ) : (
                              record.checkInTasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center space-x-1 text-sm"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    todo
                                  </Badge>
                                  <span className="truncate">
                                    {task.description}
                                  </span>
                                </div>
                              ))
                            )}
                            {record.checkInTasks.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{record.checkInTasks.length - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            {record.checkOutTasks.length === 0 ? (
                              <span className="text-gray-400">No tasks</span>
                            ) : (
                              record.checkOutTasks.slice(0, 2).map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center space-x-1 text-sm"
                                >
                                  <Badge variant="default" className="text-xs">
                                    done
                                  </Badge>
                                  <span className="truncate">
                                    {task.description}
                                  </span>
                                  {task.timeRange && (
                                    <span className="text-xs text-gray-500">
                                      ({task.timeRange})
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                            {record.checkOutTasks.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{record.checkOutTasks.length - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            {/* Check In Actions */}
                            {record.checkInTasks.length > 0 && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(record, "checkin")}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(record, "checkin")
                                  }
                                  className="h-7 px-2"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    shareToWhatsApp(record, "checkin")
                                  }
                                  className="h-7 px-2"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Check Out Actions */}
                            {record.checkOutTasks.length > 0 && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(record, "checkout")}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(record, "checkout")
                                  }
                                  className="h-7 px-2"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    shareToWhatsApp(record, "checkout")
                                  }
                                  className="h-7 px-2"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Delete Action */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(record._id!)}
                              className="h-7 px-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {editType === "checkin" ? "Check In" : "Check Out"} Tasks
            </DialogTitle>
            <DialogDescription>
              Modify your {editType === "checkin" ? "incomplete" : "completed"}{" "}
              tasks for{" "}
              {editingRecord &&
                new Date(editingRecord.date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {editTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <Badge
                      variant={editType === "checkin" ? "secondary" : "default"}
                    >
                      {editType === "checkin" ? "todo" : "done"}
                    </Badge>
                    <span className="flex-1">{task.description}</span>
                    {task.timeRange && (
                      <span className="text-sm text-gray-500">
                        ({task.timeRange})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEditTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Task */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add new task..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="flex-1"
                />
                {editType === "checkout" && (
                  <Input
                    placeholder="Time range (e.g., 08:00-17:00)"
                    value={newTaskTimeRange}
                    onChange={(e) => setNewTaskTimeRange(e.target.value)}
                    className="w-48"
                  />
                )}
                <Button onClick={addEditTask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
