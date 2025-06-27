import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, tasks } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    const db = await getDatabase();

    // Verify the record belongs to the user
    const existingRecord = await db.collection("attendance").findOne({
      _id: new ObjectId(id),
      userId: session.userId,
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
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
      updateData.checkInTasks = tasks;
      // Update check-in time if not already set
      if (!existingRecord.checkInTime) {
        updateData.checkInTime = new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } else if (type === "checkout") {
      updateData.checkOutTasks = tasks;
      // Update check-out time if not already set
      if (!existingRecord.checkOutTime) {
        updateData.checkOutTime = new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    await db
      .collection("attendance")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
    }

    const db = await getDatabase();

    // Verify the record belongs to the user and delete it
    const result = await db.collection("attendance").deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
