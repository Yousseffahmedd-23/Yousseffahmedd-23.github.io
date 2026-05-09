/**
 * Generates Postman Collection v2.1 for School Platform API.
 * Run: node scripts/build-postman.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bearer = {
  type: "bearer",
  bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
};

const noAuth = { type: "noauth" };

function jsonBody(obj) {
  return {
    mode: "raw",
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: "json" } },
  };
}

function req(name, method, urlPath, opts = {}) {
  const hdrs = [...(opts.headers ?? [])];
  if (opts.body && opts.body.mode !== "formdata") {
    hdrs.push({ key: "Content-Type", value: "application/json" });
  }
  return {
    name,
    request: {
      auth: opts.noAuth ? noAuth : bearer,
      method,
      header: hdrs,
      url: `{{baseUrl}}${urlPath}`,
      ...(opts.body ? { body: opts.body } : {}),
      ...(opts.description ? { description: opts.description } : {}),
    },
    ...(opts.events ? { event: opts.events } : {}),
  };
}

const loginTests = [
  {
    listen: "test",
    script: {
      exec: [
        "if ([200, 201].includes(pm.response.code)) {",
        "  try { const j = pm.response.json();",
        "    if (j.accessToken) pm.collectionVariables.set('accessToken', j.accessToken);",
        "    if (j.refreshToken) pm.collectionVariables.set('refreshToken', j.refreshToken);",
        "  } catch (e) {}",
        "}",
      ],
      type: "text/javascript",
    },
  },
];

const collection = {
  info: {
    name: "School Platform API",
    description:
      "MERN school API. Workflow: Run **Health**, then **Auth > Login** (sets accessToken).\nPopulate collection variables `classId`, `studentUserId`, etc. from list responses.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    _postman_id: `school-platform-${Date.now()}`,
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "accessToken", value: "" },
    { key: "refreshToken", value: "" },
    { key: "bootstrapToken", value: "change-me-bootstrap" },
    { key: "classId", value: "" },
    { key: "studentUserId", value: "" },
    { key: "parentUserId", value: "" },
    { key: "teacherUserId", value: "" },
    { key: "scheduleId", value: "" },
    { key: "finalReportId", value: "" },
    { key: "feeId", value: "" },
    { key: "materialId", value: "" },
    { key: "postId", value: "" },
    { key: "assignmentId", value: "" },
    { key: "conversationId", value: "" },
    { key: "academicYear", value: "2025-2026" },
    { key: "subjectSlug", value: "Mathematics" },
  ],
  auth: bearer,
  item: [
    {
      name: "Health",
      item: [
        req("GET /api/health", "GET", "/api/health", {
          noAuth: true,
        }),
      ],
    },
    {
      name: "Auth",
      auth: noAuth,
      item: [
        req(
          "POST bootstrap-admin",
          "POST",
          "/api/auth/bootstrap-admin",
          {
            noAuth: true,
            body: jsonBody({
              bootstrapToken: "{{bootstrapToken}}",
              email: "first-admin@school.local",
              password: "ChangeMePass123!",
              firstName: "First",
              lastName: "Admin",
            }),
          },
        ),
        req(
          "POST login",
          "POST",
          "/api/auth/login",
          {
            noAuth: true,
            events: loginTests,
            body: jsonBody({
              email: "demo-admin@school.local",
              password: "DemoPass123!",
            }),
          },
        ),
        req("POST logout", "POST", "/api/auth/logout", { noAuth: true }),
        req(
          "POST refresh",
          "POST",
          "/api/auth/refresh",
          {
            noAuth: true,
            body: jsonBody({ refreshToken: "{{refreshToken}}" }),
          },
        ),
        req(
          "POST password reset request",
          "POST",
          "/api/auth/password/reset/request",
          {
            noAuth: true,
            body: jsonBody({ email: "demo-teacher@school.local" }),
          },
        ),
        req(
          "POST password reset confirm",
          "POST",
          "/api/auth/password/reset/confirm",
          {
            noAuth: true,
            body: jsonBody({ token: "paste-dev-token", password: "NewPass12345!" }),
          },
        ),
      ],
    },
    {
      name: "Me",
      item: [
        req("GET /api/me", "GET", "/api/me"),
        req(
          "PATCH profile",
          "PATCH",
          "/api/me/profile",
          {
            body: jsonBody({ firstName: "Test", lastName: "User" }),
          },
        ),
        req(
          "PATCH password",
          "PATCH",
          "/api/me/password",
          {
            body: jsonBody({
              currentPassword: "DemoPass123!",
              newPassword: "DemoPass123!",
            }),
          },
        ),
      ],
    },
    {
      name: "Admin",
      item: [
        req("GET users", "GET", "/api/admin/users?limit=50"),
        req(
          "POST user",
          "POST",
          "/api/admin/users",
          {
            body: jsonBody({
              email: "new-teacher@s.local",
              password: "SecurePass123!",
              role: "teacher",
              firstName: "New",
              lastName: "Teacher",
            }),
          },
        ),
        req("PATCH user", "PATCH", "/api/admin/users/{{studentUserId}}", {
          description: "Set `studentUserId` variable to a Mongo user id.",
          body: jsonBody({ isActive: true }),
        }),
        req("DELETE student user", "DELETE", "/api/admin/users/{{studentUserId}}", {
          description: "Only **student** role. Soft-delete.",
        }),
        req("GET classes", "GET", "/api/admin/classes"),
        req(
          "POST class",
          "POST",
          "/api/admin/classes",
          {
            body: jsonBody({
              name: "Science 101",
              subject: "Science",
              gradeLevel: "9",
              academicYear: "{{academicYear}}",
            }),
          },
        ),
        req("PATCH class", "PATCH", "/api/admin/classes/{{classId}}", {
          body: jsonBody({ name: "Science 101 (renamed)" }),
        }),
        req("DELETE class", "DELETE", "/api/admin/classes/{{classId}}"),
        req(
          "POST attach teacher",
          "POST",
          "/api/admin/classes/{{classId}}/teachers",
          {
            body: jsonBody({ teacherUserId: "{{teacherUserId}}" }),
          },
        ),
        req("DELETE detach teacher", "DELETE", "/api/admin/classes/{{classId}}/teachers/{{teacherUserId}}"),
        req("GET schedules", "GET", "/api/admin/classes/{{classId}}/schedules"),
        req(
          "POST schedule",
          "POST",
          "/api/admin/classes/{{classId}}/schedules",
          {
            body: jsonBody({
              title: "Term 1",
              slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "A1" }],
            }),
          },
        ),
        req("DELETE schedule", "DELETE", "/api/admin/schedules/{{scheduleId}}"),
        req(
          "POST enrollment",
          "POST",
          "/api/admin/enrollments",
          {
            body: jsonBody({ studentUserId: "{{studentUserId}}", classId: "{{classId}}" }),
          },
        ),
        req(
          "DELETE enrollment drop",
          "DELETE",
          "/api/admin/enrollments",
          {
            description: 'Body for DELETE supported by axios/Postman; ensure body tab has JSON.',
            body: jsonBody({
              studentUserId: "{{studentUserId}}",
              classId: "{{classId}}",
            }),
          },
        ),
        req(
          "POST parent-child link",
          "POST",
          "/api/admin/links/parent-child",
          {
            body: jsonBody({ parentUserId: "{{parentUserId}}", studentUserId: "{{studentUserId}}" }),
          },
        ),
        req("DELETE parent-child link", "DELETE", "/api/admin/links/parent-child?parentUserId={{parentUserId}}&studentUserId={{studentUserId}}"),
        req("GET parent dashboard", "GET", "/api/admin/parents/{{parentUserId}}/dashboard"),
        req(
          "POST final report upsert",
          "POST",
          "/api/admin/final-reports",
          {
            body: jsonBody({
              studentUserId: "{{studentUserId}}",
              academicYear: "{{academicYear}}",
              summary: "Draft summary",
              pdfUrl: "",
            }),
          },
        ),
        req("POST publish final report", "POST", "/api/admin/final-reports/{{finalReportId}}/publish"),
        req("DELETE final report", "DELETE", "/api/admin/final-reports/{{finalReportId}}"),
        req(
          "POST fee",
          "POST",
          "/api/admin/fees",
          {
            body: jsonBody({
              studentUserId: "{{studentUserId}}",
              amount: 250,
              label: "Lab fee",
              dueDate: "2026-12-31",
            }),
          },
        ),
        req("PATCH fee", "PATCH", "/api/admin/fees/{{feeId}}", {
          body: jsonBody({ status: "partial" }),
        }),
        req("DELETE fee", "DELETE", "/api/admin/fees/{{feeId}}"),
        req("DELETE material (moderate)", "DELETE", "/api/admin/materials/{{materialId}}"),
        req(
          "PATCH gradebook (admin)",
          "PATCH",
          "/api/admin/grades",
          {
            body: jsonBody({
              studentUserId: "{{studentUserId}}",
              classId: "{{classId}}",
              academicTerm: "fall",
              attendance: 100,
              classwork: 90,
            }),
          },
        ),
        req("GET settings", "GET", "/api/admin/settings"),
        req(
          "PUT setting",
          "PUT",
          "/api/admin/settings/grade_weights",
          {
            body: jsonBody({
              value: { attendance: 0.1, classwork: 0.2, quiz: 0.2, midterm: 0.25, finalExam: 0.25 },
            }),
          },
        ),
      ],
    },
    {
      name: "Parent",
      item: [
        req("GET children", "GET", "/api/parent/children"),
        req("GET child detail", "GET", "/api/parent/children/{{studentUserId}}"),
        req("GET child grades by subject", "GET", "/api/parent/children/{{studentUserId}}/grades/by-subject"),
        req(
          "GET child final report",
          "GET",
          "/api/parent/children/{{studentUserId}}/final-report?academicYear={{academicYear}}",
        ),
        req("POST mock subscription upgrade", "POST", "/api/parent/subscription/mock-upgrade"),
        req("POST mock subscription cancel", "POST", "/api/parent/subscription/mock-cancel"),
        req("GET fees", "GET", "/api/parent/fees"),
        req(
          "POST fees pay (mock)",
          "POST",
          "/api/parent/fees/pay",
          {
            body: jsonBody({ feeIds: ["{{feeId}}"] }),
          },
        ),
        req(
          "GET class details",
          "GET",
          "/api/parent/classes/{{classId}}/details?studentUserId={{studentUserId}}",
        ),
        req("GET chat conversations", "GET", "/api/parent/chat/conversations"),
        req(
          "POST chat conversation",
          "POST",
          "/api/parent/chat/conversations",
          {
            body: jsonBody({ teacherUserId: "{{teacherUserId}}", studentUserId: "{{studentUserId}}" }),
          },
        ),
        req(
          "GET chat messages",
          "GET",
          "/api/parent/chat/conversations/{{conversationId}}/messages?page=1&limit=20",
        ),
        req(
          "POST chat message",
          "POST",
          "/api/parent/chat/conversations/{{conversationId}}/messages",
          {
            body: jsonBody({ body: "Hello from parent" }),
          },
        ),
      ],
    },
    {
      name: "Teacher",
      item: [
        req("GET my classes", "GET", "/api/teacher/classes"),
        req("GET class students", "GET", "/api/teacher/classes/{{classId}}/students"),
        req(
          "PATCH grades",
          "PATCH",
          "/api/teacher/grades",
          {
            body: jsonBody({
              studentUserId: "{{studentUserId}}",
              classId: "{{classId}}",
              academicTerm: "fall",
              quiz: 88,
              midterm: 84,
              finalExam: 91,
            }),
          },
        ),
        req(
          "POST material",
          "POST",
          "/api/teacher/classes/{{classId}}/materials",
          {
            body: jsonBody({
              title: "Handout",
              fileUrl: "/uploads/demo.pdf",
              kind: "lecture",
            }),
          },
        ),
        req("PATCH material", "PATCH", "/api/teacher/materials/{{materialId}}", {
          body: jsonBody({ title: "Handout renamed" }),
        }),
        req("DELETE material", "DELETE", "/api/teacher/materials/{{materialId}}"),
        req(
          "POST class post",
          "POST",
          "/api/teacher/classes/{{classId}}/posts",
          {
            body: jsonBody({ body: "Class announcement" }),
          },
        ),
        req(
          "POST comment",
          "POST",
          "/api/teacher/posts/{{postId}}/comments",
          {
            body: jsonBody({ body: "Comment" }),
          },
        ),
        req(
          "POST assignment",
          "POST",
          "/api/teacher/classes/{{classId}}/assignments",
          {
            body: jsonBody({ title: "HW2", instructions: "Read chapter 2", dueAt: "2026-12-31T23:59:59.000Z" }),
          },
        ),
        req("GET chat conversations", "GET", "/api/teacher/chat/conversations"),
        req("GET chat messages", "GET", "/api/teacher/chat/conversations/{{conversationId}}/messages"),
        req(
          "POST chat message",
          "POST",
          "/api/teacher/chat/conversations/{{conversationId}}/messages",
          {
            body: jsonBody({ body: "Reply from teacher" }),
          },
        ),
      ],
    },
    {
      name: "Student",
      item: [
        req("GET classes", "GET", "/api/student/classes"),
        req("GET class overview", "GET", "/api/student/classes/{{classId}}/overview"),
        req("GET grades", "GET", "/api/student/grades"),
        req(
          "GET subject",
          "GET",
          "/api/student/subjects/{{subjectSlug}}",
        ),
        req("GET final report", "GET", "/api/student/final-report?academicYear={{academicYear}}"),
        req("GET assignments", "GET", "/api/student/assignments"),
        req(
          "POST submit assignment",
          "POST",
          "/api/student/assignments/{{assignmentId}}/submit",
          {
            body: jsonBody({
              files: [{ fileUrl: "/uploads/demo.txt", name: "work.pdf" }],
            }),
          },
        ),
      ],
    },
    {
      name: "Files",
      item: [
        {
          name: "POST multipart file",
          request: {
            auth: bearer,
            method: "POST",
            header: [],
            body: {
              mode: "formdata",
              formdata: [
                {
                  key: "file",
                  type: "file",
                  src: [],
                  description: "Pick any small file.",
                },
              ],
            },
            url: "{{baseUrl}}/api/files",
          },
        },
      ],
    },
  ],
};

const outDir = path.join(__dirname, "../../postman");
fs.mkdirSync(outDir, { recursive: true });

const outfile = path.join(outDir, "School_Platform_API.postman_collection.json");
fs.writeFileSync(outfile, JSON.stringify(collection, null, 2), "utf8");
console.log("Wrote", outfile);

const envOut = path.join(outDir, "Local.postman_environment.json");
const envDoc = {
  id: `local-env-school-${Date.now()}`,
  name: "School Platform — Local",
  values: [
    { key: "baseUrl", value: "http://localhost:5000", enabled: true },
    { key: "accessToken", value: "", enabled: true },
    { key: "refreshToken", value: "", enabled: true },
  ],
  _postman_variable_scope: "environment",
};
fs.writeFileSync(envOut, JSON.stringify(envDoc, null, 2), "utf8");
console.log("Wrote", envOut);
