import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";
import Modal from "../components/Modal.jsx";

export default function Enrollments() {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ studentUserId: "", classId: "" });
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [msg,      setMsg]      = useState("");
  const [search,   setSearch]   = useState("");
  const [selClass, setSelClass] = useState("");
  const [enrolled, setEnrolled] = useState([]);

  const load = () => {
    Promise.all([
      api.listUsers({ role: "student", limit: 100 }),
      api.listClasses(),
    ]).then(([s, c]) => { setStudents(s.items); setClasses(c.items); });
  };
  useEffect(load, []);
  useEffect(() => {
    window.addEventListener("sabboora:school-sync", load);
    return () => window.removeEventListener("sabboora:school-sync", load);
  }, []);

  async function handleEnroll() {
    setSaving(true); setErr("");
    try {
      await api.enroll(form.studentUserId, form.classId);
      setMsg("Student enrolled successfully!");
      setModal(false);
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setErr(e.body?.message ?? e.message); }
    finally { setSaving(false); }
  }

  async function handleDrop(studentUserId, classId) {
    if (!confirm("Drop this enrollment?")) return;
    await api.unenroll(studentUserId, classId).catch(e => alert(e.message));
    setMsg("Enrollment dropped."); setTimeout(() => setMsg(""), 2000);
  }

  // Build display list: for each class, show its students
  const display = selClass
    ? classes.filter(c => c._id === selClass)
    : classes.slice(0, 20);

  return (
    <div>
      <div className="page-hd">
        <div><h2>Enrollments</h2><p>Manage student ↔ class assignments</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ studentUserId:"", classId:"" }); setErr(""); setModal(true); }}>+ Enroll student</button>
      </div>

      {msg && <div style={{marginBottom:"1rem",padding:".75rem 1rem",background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:6,color:"#059669",fontWeight:500}}>{msg}</div>}

      {/* Filter by class */}
      <div style={{display:"flex",gap:"1rem",marginBottom:"1rem",flexWrap:"wrap"}}>
        <select className="select" style={{maxWidth:280}} value={selClass} onChange={e => setSelClass(e.target.value)}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input className="input" style={{maxWidth:260}} placeholder="Search student email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Quick enroll table per class */}
      <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
        {display.map(cls => {
          const classStudents = students.filter(s => {
            const sq = search.toLowerCase();
            return !sq || s.email.toLowerCase().includes(sq);
          });
          return (
            <div className="card" key={cls._id}>
              <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:700}}>{cls.name}</span>
                  <span style={{marginLeft:".75rem",color:"var(--text-3)",fontSize:".8rem"}}>{cls.subject} · {cls.academicYear}</span>
                </div>
              </div>
              <div style={{padding:"1rem 1.25rem",fontSize:".875rem",color:"var(--text-2)"}}>
                Use "Enroll student" button to add a student to this class, then drop from here.
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="Enroll Student in Class" onClose={() => setModal(false)}>
          {err && <div style={{padding:".6rem",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,color:"#dc2626",fontSize:".875rem"}}>{err}</div>}
          <div className="form-field">
            <label className="form-label">Student *</label>
            <select className="select" value={form.studentUserId} onChange={e => setForm(f => ({...f,studentUserId:e.target.value}))}>
              <option value="">— select student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Class *</label>
            <select className="select" value={form.classId} onChange={e => setForm(f => ({...f,classId:e.target.value}))}>
              <option value="">— select class —</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.subject})</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:".75rem",justifyContent:"flex-end"}}>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEnroll} disabled={saving || !form.studentUserId || !form.classId}>
              {saving ? "Enrolling…" : "Enroll"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
