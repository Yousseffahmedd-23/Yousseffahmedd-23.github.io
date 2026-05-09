import { AdminProfile } from "../models/AdminProfile.js";
import { TeacherProfile } from "../models/TeacherProfile.js";
import { ParentProfile } from "../models/ParentProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { decryptOptional, encryptOptional } from "../utils/pii.js";

export async function getProfileForUser(user) {
  const id = user._id;
  if (user.role === "admin") return AdminProfile.findOne({ userId: id }).lean();
  if (user.role === "teacher") return TeacherProfile.findOne({ userId: id }).lean();
  if (user.role === "parent") {
    const p = await ParentProfile.findOne({ userId: id }).lean();
    if (p?.phone) p.phone = decryptOptional(p.phone);
    return p;
  }
  if (user.role === "student") return StudentProfile.findOne({ userId: id }).lean();
  return null;
}

export async function upsertProfile(user, patch) {
  const id = user._id;
  if (user.role === "admin") {
    return AdminProfile.findOneAndUpdate(
      { userId: id },
      { $set: { firstName: patch.firstName, lastName: patch.lastName, phone: patch.phone } },
      { upsert: true, new: true },
    ).lean();
  }
  if (user.role === "teacher") {
    return TeacherProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          firstName: patch.firstName,
          lastName: patch.lastName,
          phone: patch.phone,
          subjects: patch.subjects,
          bio: patch.bio,
        },
      },
      { upsert: true, new: true },
    ).lean();
  }
  if (user.role === "parent") {
    const phoneEnc = patch.phone !== undefined ? encryptOptional(patch.phone) : undefined;
    const row = await ParentProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          firstName: patch.firstName,
          lastName: patch.lastName,
          ...(patch.address !== undefined && { address: patch.address }),
          ...(phoneEnc !== undefined && { phone: phoneEnc }),
        },
      },
      { upsert: true, new: true },
    ).lean();
    if (row?.phone) row.phone = decryptOptional(row.phone);
    return row;
  }
  if (user.role === "student") {
    return StudentProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          firstName: patch.firstName,
          lastName: patch.lastName,
          dateOfBirth: patch.dateOfBirth,
          gradeLevel: patch.gradeLevel,
        },
      },
      { upsert: true, new: true },
    ).lean();
  }
  return null;
}

export async function createProfileForNewUser(role, userId, payload) {
  if (role === "admin") {
    await AdminProfile.create({
      userId,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      phone: payload.phone ?? "",
    });
  } else if (role === "teacher") {
    await TeacherProfile.create({
      userId,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      phone: payload.phone ?? "",
      subjects: payload.subjects ?? [],
      bio: payload.bio ?? "",
    });
  } else if (role === "parent") {
    await ParentProfile.create({
      userId,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      phone: encryptOptional(payload.phone ?? "") || payload.phone || "",
      address: payload.address ?? "",
    });
  } else if (role === "student") {
    await StudentProfile.create({
      userId,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      dateOfBirth: payload.dateOfBirth ?? null,
      gradeLevel: payload.gradeLevel ?? "",
    });
  }
}
