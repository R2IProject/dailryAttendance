import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import type { AttendanceFilters } from "@/lib/types";
import { Filter, Document } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: AttendanceFilters = {
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Number.parseInt(searchParams.get("limit") || "10"),
    };

    const db = await getDatabase();

    // Build query
    const query: Filter<Document> = { userId: session.userId };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    if (filters.search) {
      query.$or = [
        {
          "checkInTasks.description": { $regex: filters.search, $options: "i" },
        },
        {
          "checkOutTasks.description": {
            $regex: filters.search,
            $options: "i",
          },
        },
      ];
    }

    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);

    const [records, total] = await Promise.all([
      db
        .collection("attendance")
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(filters.limit || 10)
        .toArray(),
      db.collection("attendance").countDocuments(query),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        pages: Math.ceil(total / (filters.limit || 10)),
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, tasks } = await request.json();
    const today = new Date().toISOString().split("T")[0];
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    const currentTime = formatter.format(new Date());
    const db = await getDatabase();

    // Find or create today's attendance record
    let attendanceRecord = await db.collection("attendance").findOne({
      userId: session.userId,
      date: today,
    });

    if (!attendanceRecord) {
      const newRecord = {
        userId: session.userId,
        userName: session.name,
        date: today,
        checkInTasks: [],
        checkOutTasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("attendance").insertOne(newRecord);
      attendanceRecord = { ...newRecord, _id: result.insertedId };
    }

    // Update based on type
    const updateData: Partial<{
      checkInTasks: string[];
      checkOutTasks: string[];
      checkInTime: string;
      checkOutTime: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (type === "checkin") {
      updateData.checkInTime = currentTime;
      updateData.checkInTasks = tasks;
    } else if (type === "checkout") {
      updateData.checkOutTime = currentTime;
      updateData.checkOutTasks = tasks;
    }

    await db
      .collection("attendance")
      .updateOne({ _id: attendanceRecord._id }, { $set: updateData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
