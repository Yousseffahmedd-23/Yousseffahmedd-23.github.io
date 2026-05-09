import { apiFetch } from "./client.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  apiFetch("/api/auth/login", { method: "POST", body: { email, password } });

// ── Users ─────────────────────────────────────────────────────────────────────
export const listUsers   = (params = {}) => apiFetch("/api/admin/users?" + new URLSearchParams(params));
export const createUser  = (body)        => apiFetch("/api/admin/users",    { method: "POST",   body });
export const updateUser  = (id, body)    => apiFetch(`/api/admin/users/${id}`, { method: "PATCH",  body });
export const deleteUser  = (id)          => apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });

// ── Classes ───────────────────────────────────────────────────────────────────
export const listClasses   = ()          => apiFetch("/api/admin/classes");
export const createClass   = (body)      => apiFetch("/api/admin/classes",      { method: "POST",   body });
export const updateClass   = (id, body)  => apiFetch(`/api/admin/classes/${id}`, { method: "PATCH",  body });
export const deleteClass   = (id)        => apiFetch(`/api/admin/classes/${id}`, { method: "DELETE" });
export const addTeacher    = (cid, tid)  => apiFetch(`/api/admin/classes/${cid}/teachers`, { method: "POST", body: { teacherUserId: tid } });
export const removeTeacher = (cid, tid)  => apiFetch(`/api/admin/classes/${cid}/teachers/${tid}`, { method: "DELETE" });

// ── Enrollments ───────────────────────────────────────────────────────────────
export const enroll  = (studentUserId, classId) => apiFetch("/api/admin/enrollments", { method: "POST",   body: { studentUserId, classId } });
export const unenroll = (studentUserId, classId) => apiFetch("/api/admin/enrollments", { method: "DELETE", body: { studentUserId, classId } });

// ── Grades ────────────────────────────────────────────────────────────────────
export const upsertGrade = (body) => apiFetch("/api/admin/grades", { method: "PATCH", body });

// ── Assignments ───────────────────────────────────────────────────────────────
export const listAssignments = (params = {}) =>
  apiFetch("/api/admin/assignments?" + new URLSearchParams(params));

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings    = ()              => apiFetch("/api/admin/settings");
export const updateSetting  = (key, value)    => apiFetch(`/api/admin/settings/${key}`, { method: "PUT", body: { value } });

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = () => apiFetch("/api/health");
