/**
 * Thin wrappers around the Express API. Uses {@link ./client.js apiFetch} (JWT + refresh).
 */
import { apiFetch } from "./client.js";

export function getHealth() {
  return apiFetch("/api/health");
}

export function getMe() {
  return apiFetch("/api/me");
}

/** --- Admin --- */
export function adminListUsers(opts = {}) {
  const q = new URLSearchParams({ limit: String(opts.limit ?? 50) });
  if (opts.role) q.set("role", opts.role);
  if (opts.page) q.set("page", String(opts.page));
  return apiFetch(`/api/admin/users?${q}`);
}

export function adminListClasses() {
  return apiFetch("/api/admin/classes");
}

export function adminSettings() {
  return apiFetch("/api/admin/settings");
}

/** --- Parent --- */
export function parentChildren() {
  return apiFetch("/api/parent/children");
}

export function parentChildDetail(studentId) {
  return apiFetch(`/api/parent/children/${encodeURIComponent(studentId)}`);
}

export function parentSubscriptionMockUpgrade() {
  return apiFetch("/api/parent/subscription/mock-upgrade", { method: "POST", body: {} });
}

export function parentSubscriptionMockCancel() {
  return apiFetch("/api/parent/subscription/mock-cancel", { method: "POST", body: {} });
}

export function parentPayFees(feeIds) {
  return apiFetch("/api/parent/fees/pay", { method: "POST", body: { feeIds } });
}

export function parentFees() {
  return apiFetch("/api/parent/fees");
}

export function parentConversations() {
  return apiFetch("/api/parent/chat/conversations");
}

export function parentClassDetails(classId, studentUserId) {
  const q = new URLSearchParams({ studentUserId });
  return apiFetch(`/api/parent/classes/${encodeURIComponent(classId)}/details?${q}`);
}

export function parentChildFinalReport(studentId, academicYear) {
  const q = new URLSearchParams({ academicYear });
  return apiFetch(`/api/parent/children/${encodeURIComponent(studentId)}/final-report?${q}`);
}

export function parentChildGradesBySubject(studentId) {
  return apiFetch(`/api/parent/children/${encodeURIComponent(studentId)}/grades/by-subject`);
}

/** --- Teacher --- */
export function teacherClasses() {
  return apiFetch("/api/teacher/classes");
}

export function teacherClassStudents(classId) {
  return apiFetch(`/api/teacher/classes/${encodeURIComponent(classId)}/students`);
}

export function teacherConversations() {
  return apiFetch("/api/teacher/chat/conversations");
}

/** --- Student --- */
export function studentClasses() {
  return apiFetch("/api/student/classes");
}

export function studentGrades() {
  return apiFetch("/api/student/grades");
}

export function studentAssignments() {
  return apiFetch("/api/student/assignments");
}

export function studentClassOverview(classId) {
  return apiFetch(`/api/student/classes/${encodeURIComponent(classId)}/overview`);
}

export function studentFinalReport(academicYear) {
  const q = new URLSearchParams({ academicYear });
  return apiFetch(`/api/student/final-report?${q}`);
}

export function studentSubjectDetail(subject) {
  return apiFetch(`/api/student/subjects/${encodeURIComponent(subject)}`);
}

export function studentSubmitAssignment(assignmentId, files) {
  return apiFetch(`/api/student/assignments/${encodeURIComponent(assignmentId)}/submit`, {
    method: "POST",
    body: { files },
  });
}

/** POST multipart; body must be FormData with field name `file`. */
export function uploadFile(formData) {
  return apiFetch("/api/files", { method: "POST", body: formData });
}
