import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { _id: false },
);

const classScheduleSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, default: "" },
    slots: [slotSchema],
  },
  { timestamps: true, collection: "class_schedules" },
);

classScheduleSchema.index({ classId: 1 });

export const ClassSchedule = mongoose.model("ClassSchedule", classScheduleSchema);
