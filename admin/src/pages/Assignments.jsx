import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";

export default function Assignments() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const load = (p = page) => {
    setLoading(true);
    api.listAssignments({ limit:20, page:p })
      .then(d => { setItems(d.items); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => load(page), [page]); // eslint-disable-line

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <div>
      <div className="page-hd">
        <div><h2>Assignments</h2><p>{total} total (read-only overview — teachers manage assignments)</p></div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Title</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Due</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} style={{textAlign:"center",padding:"2rem",color:"var(--text-3)"}}>Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} style={{textAlign:"center",padding:"2rem",color:"var(--text-3)"}}>No assignments yet.</td></tr>}
            {!loading && items.map(a => (
              <tr key={a._id}>
                <td style={{fontWeight:600}}>{a.title}</td>
                <td>{a.classId?.name ?? "—"}</td>
                <td>{a.classId?.subject ?? "—"}</td>
                <td>{a.teacherUserId?.email?.split("@")[0] ?? "—"}</td>
                <td>{fmt(a.dueAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div style={{display:"flex",gap:".5rem",marginTop:"1rem",justifyContent:"center"}}>
          <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span style={{lineHeight:"2rem",fontSize:".875rem"}}>Page {page} of {Math.ceil(total/20)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
