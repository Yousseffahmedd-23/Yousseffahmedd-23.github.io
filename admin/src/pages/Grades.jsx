import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";
import Modal from "../components/Modal.jsx";

const GRADE_FIELDS = ["attendance","classwork","quiz","midterm","finalExam"];
const GRADE_LABELS = { attendance:"Attendance",classwork:"Classwork",quiz:"Quiz",midterm:"Midterm",finalExam:"Final Exam" };
const EMPTY_GRADE  = { studentUserId:"", classId:"", academicTerm:"", subject:"", attendance:"", classwork:"", quiz:"", midterm:"", finalExam:"" };

export default function Grades() {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_GRADE);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [msg,      setMsg]      = useState("");

  useEffect(() => {
    Promise.all([api.listUsers({role:"student",limit:100}), api.listClasses()])
      .then(([s,c]) => { setStudents(s.items); setClasses(c.items); });
  }, []);

  useEffect(() => {
    const h = () => Promise.all([api.listUsers({role:"student",limit:100}), api.listClasses()])
      .then(([s,c]) => { setStudents(s.items); setClasses(c.items); });
    window.addEventListener("sabboora:school-sync", h);
    return () => window.removeEventListener("sabboora:school-sync", h);
  }, []);

  async function handleSave() {
    setSaving(true); setErr("");
    const body = { ...form };
    // Convert empty strings to undefined
    GRADE_FIELDS.forEach(f => { if (body[f] === "") delete body[f]; else body[f] = Number(body[f]); });
    try {
      await api.upsertGrade(body);
      setMsg("Grade saved!"); setModal(false);
      setTimeout(() => setMsg(""), 3000);
    } catch(e) { setErr(e.body?.message ?? e.message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-hd">
        <div><h2>Grade Management</h2><p>Enter or update student grades per class and term</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_GRADE); setErr(""); setModal(true); }}>+ Enter grade</button>
      </div>

      {msg && <div style={{marginBottom:"1rem",padding:".75rem 1rem",background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:6,color:"#059669",fontWeight:500}}>{msg}</div>}

      <div className="card card-pad" style={{color:"var(--text-2)",fontSize:".9rem"}}>
        <p>Use the <strong>Enter grade</strong> button to add or update a student's gradebook entry. Select the student, class, and academic term, then fill in individual score components (0–100 each).</p>
        <p style={{marginTop:".5rem"}}>Grade components: Attendance · Classwork · Quiz · Midterm · Final Exam</p>
      </div>

      {modal && (
        <Modal title="Enter / Update Grade" onClose={() => setModal(false)} wide>
          {err && <div style={{padding:".6rem",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,color:"#dc2626",fontSize:".875rem"}}>{err}</div>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
            <div className="form-field">
              <label className="form-label">Student *</label>
              <select className="select" value={form.studentUserId} onChange={e => setForm(f=>({...f,studentUserId:e.target.value}))}>
                <option value="">— select —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Class *</label>
              <select className="select" value={form.classId} onChange={e => setForm(f=>({...f,classId:e.target.value}))}>
                <option value="">— select —</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Academic term</label>
              <input className="input" placeholder="e.g. Q1" value={form.academicTerm} onChange={e => setForm(f=>({...f,academicTerm:e.target.value}))} />
            </div>
            <div className="form-field">
              <label className="form-label">Subject</label>
              <input className="input" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))} />
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"1rem"}}>
            {GRADE_FIELDS.map(f => (
              <div className="form-field" key={f}>
                <label className="form-label">{GRADE_LABELS[f]} (0–100)</label>
                <input className="input" type="number" min="0" max="100" placeholder="—" value={form[f]} onChange={e => setForm(fg=>({...fg,[f]:e.target.value}))} />
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:".75rem",justifyContent:"flex-end"}}>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.studentUserId || !form.classId}>
              {saving ? "Saving…" : "Save grade"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
