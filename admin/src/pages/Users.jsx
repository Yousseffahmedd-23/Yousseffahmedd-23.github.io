import { useEffect, useReducer, useState } from "react";
import * as api from "../api/adminApi.js";
import Modal from "../components/Modal.jsx";

const ROLES = ["teacher", "student", "parent", "admin"];

const EMPTY_FORM = {
  email: "", password: "", role: "student",
  firstName: "", lastName: "", phone: "", gradeLevel: "", bio: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "set":    return { ...state, ...action.payload };
    case "reset":  return { ...EMPTY_FORM, role: action.role ?? "student" };
    default:       return state;
  }
}

export default function Users() {
  const [tab,     setTab]     = useState("student");
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(null); // null | "create" | "edit"
  const [editing, setEditing] = useState(null);
  const [form,    dispatch]   = useReducer(reducer, EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const load = (role = tab) => {
    setLoading(true);
    api.listUsers({ role, limit: 100 })
      .then(d => { setUsers(d.items); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]); // eslint-disable-line

  // Realtime refresh
  useEffect(() => {
    const h = () => load();
    window.addEventListener("sabboora:school-sync", h);
    return () => window.removeEventListener("sabboora:school-sync", h);
  }, [tab]); // eslint-disable-line

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    dispatch({ type: "reset", role: tab });
    setEditing(null);
    setErr("");
    setModal("create");
  }

  function openEdit(u) {
    dispatch({ type: "set", payload: { email: u.email, isActive: u.isActive, role: u.role } });
    setEditing(u);
    setErr("");
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setErr("");
    try {
      if (modal === "create") {
        await api.createUser({ ...form, role: tab });
      } else {
        await api.updateUser(editing.id, { email: form.email, isActive: form.isActive });
      }
      setModal(null);
      load();
    } catch (e) {
      setErr(e.body?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    await api.updateUser(u.id, { isActive: !u.isActive }).catch(() => {});
    load();
  }

  async function handleDelete(u) {
    if (!confirm(`Deactivate ${u.email}?`)) return;
    await api.deleteUser(u.id).catch(e => alert(e.body?.message ?? e.message));
    load();
  }

  const roleColors = { teacher:"badge-green", student:"badge-blue", parent:"badge-yellow", admin:"badge-gray" };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h2>User Management</h2>
          <p>{total} {tab}s total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add {tab}</button>
      </div>

      {/* Role tabs */}
      <div className="tabs">
        {ROLES.map(r => (
          <button key={r} className={`tab-btn${tab === r ? " active" : ""}`} onClick={() => setTab(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)}s
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:"1rem", maxWidth:320 }}>
        <input className="input" placeholder="Search by email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width:150 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} style={{ textAlign:"center", color:"var(--text-3)", padding:"2rem" }}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign:"center", color:"var(--text-3)", padding:"2rem" }}>No {tab}s found.</td></tr>
            )}
            {!loading && filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight:500 }}>{u.email}</td>
                <td><span className={`badge ${roleColors[u.role] ?? "badge-gray"}`}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div style={{ display:"flex", gap:".4rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    {u.role === "student" && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Del</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === "create" ? `Add ${tab}` : `Edit user`} onClose={() => setModal(null)}>
          {err && <div className="form-error" style={{ padding:".6rem .875rem", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#dc2626", fontSize:".875rem" }}>{err}</div>}

          <div className="form-field">
            <label className="form-label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => dispatch({ type:"set", payload:{ email:e.target.value } })} />
          </div>

          {modal === "create" && <>
            <div className="form-field">
              <label className="form-label">Password * (min 8 chars)</label>
              <input className="input" type="password" value={form.password} onChange={e => dispatch({ type:"set", payload:{ password:e.target.value } })} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <div className="form-field">
                <label className="form-label">First name</label>
                <input className="input" value={form.firstName} onChange={e => dispatch({ type:"set", payload:{ firstName:e.target.value } })} />
              </div>
              <div className="form-field">
                <label className="form-label">Last name</label>
                <input className="input" value={form.lastName} onChange={e => dispatch({ type:"set", payload:{ lastName:e.target.value } })} />
              </div>
            </div>
            {tab === "student" && (
              <div className="form-field">
                <label className="form-label">Grade level</label>
                <input className="input" placeholder="e.g. 10" value={form.gradeLevel} onChange={e => dispatch({ type:"set", payload:{ gradeLevel:e.target.value } })} />
              </div>
            )}
            {(tab === "teacher" || tab === "parent") && (
              <div className="form-field">
                <label className="form-label">Phone</label>
                <input className="input" value={form.phone} onChange={e => dispatch({ type:"set", payload:{ phone:e.target.value } })} />
              </div>
            )}
          </>}

          {modal === "edit" && (
            <div className="form-field">
              <label className="form-label">Active</label>
              <select className="select" value={String(form.isActive)} onChange={e => dispatch({ type:"set", payload:{ isActive: e.target.value === "true" } })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : modal === "create" ? "Create" : "Save changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
