import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";
import Modal from "../components/Modal.jsx";

const EMPTY = { name: "", subject: "", gradeLevel: "", academicYear: "2025-2026", description: "" };

export default function Classes() {
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [teachers, setTeachers] = useState([]);
  const [search,   setSearch]   = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.listClasses(), api.listUsers({ role: "teacher", limit: 100 })])
      .then(([c, t]) => { setClasses(c.items); setTeachers(t.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    const h = () => load();
    window.addEventListener("sabboora:school-sync", h);
    return () => window.removeEventListener("sabboora:school-sync", h);
  }, []);

  function openCreate() { setForm(EMPTY); setEditing(null); setErr(""); setModal("form"); }
  function openEdit(c) { setForm({ name:c.name, subject:c.subject||"", gradeLevel:c.gradeLevel||"", academicYear:c.academicYear||"2025-2026", description:c.description||"" }); setEditing(c); setErr(""); setModal("form"); }

  async function handleSave() {
    setSaving(true); setErr("");
    try {
      if (editing) await api.updateClass(editing._id, form);
      else         await api.createClass(form);
      setModal(null); load();
    } catch (e) { setErr(e.body?.message ?? e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete class "${c.name}"? This removes all enrollments and grades.`)) return;
    await api.deleteClass(c._id).catch(e => alert(e.message));
    load();
  }

  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-hd">
        <div><h2>Classes</h2><p>{classes.length} total</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ New class</button>
      </div>

      <div style={{ marginBottom:"1rem", maxWidth:320 }}>
        <input className="input" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Subject</th><th>Grade</th><th>Year</th><th>Teachers</th><th style={{width:140}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{textAlign:"center",padding:"2rem",color:"var(--text-3)"}}>Loading…</td></tr>}
            {!loading && filtered.map(c => {
              const tNames = c.teacherIds?.map(tid => {
                const t = teachers.find(u => u.id === String(tid));
                return t?.email?.split("@")[0] ?? tid;
              }) ?? [];
              return (
                <tr key={c._id}>
                  <td style={{fontWeight:600}}>{c.name}</td>
                  <td>{c.subject || "—"}</td>
                  <td>{c.gradeLevel || "—"}</td>
                  <td>{c.academicYear || "—"}</td>
                  <td>{tNames.length ? tNames.join(", ") : <span style={{color:"var(--text-3)"}}>None</span>}</td>
                  <td>
                    <div style={{display:"flex",gap:".4rem"}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:"center",padding:"2rem",color:"var(--text-3)"}}>No classes found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal === "form" && (
        <Modal title={editing ? "Edit Class" : "New Class"} onClose={() => setModal(null)}>
          {err && <div style={{padding:".6rem .875rem",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,color:"#dc2626",fontSize:".875rem"}}>{err}</div>}
          {[["name","Class name *"],["subject","Subject"],["gradeLevel","Grade level"],["academicYear","Academic year"]].map(([k,label]) => (
            <div className="form-field" key={k}>
              <label className="form-label">{label}</label>
              <input className="input" value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} />
            </div>
          ))}
          <div style={{display:"flex",gap:".75rem",justifyContent:"flex-end"}}>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
