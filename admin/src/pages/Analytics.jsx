import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";

function BarChart({ data, height = 140 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height, padding:"0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:".72rem", color:"var(--text-3)", fontWeight:600 }}>{d.value}</span>
          <div style={{ width:"100%", background: d.color || "var(--brand)", borderRadius:"4px 4px 0 0", height: `${Math.round((d.value/max)*100)}%`, minHeight:4, transition:"height .4s" }} />
          <span style={{ fontSize:".7rem", color:"var(--text-3)", textAlign:"center", lineHeight:1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.listUsers({ limit: 100 }),
      api.listClasses(),
    ]).then(([u, c]) => {
      const users   = u.status === "fulfilled" ? u.value : { items:[], total:0 };
      const classes = c.status === "fulfilled" ? c.value : { items:[] };
      setData({ users, classes });
    });
  }, []);

  useEffect(() => {
    const h = () => Promise.allSettled([api.listUsers({limit:100}), api.listClasses()])
      .then(([u,c]) => setData({ users:u.value, classes:c.value }));
    window.addEventListener("sabboora:school-sync", h);
    return () => window.removeEventListener("sabboora:school-sync", h);
  }, []);

  if (!data) return <div className="empty-state">Loading analytics…</div>;

  const { users, classes } = data;
  const byRole = ["admin","teacher","student","parent"].map(r => ({
    label: r.charAt(0).toUpperCase()+r.slice(1)+"s",
    value: users.items.filter(u => u.role === r).length,
    color: { admin:"#7c3aed", teacher:"#059669", student:"#2563eb", parent:"#d97706" }[r],
  }));

  const activeRate  = users.total ? Math.round((users.items.filter(u=>u.isActive).length / users.total)*100) : 0;

  // Classes by academic year
  const byYear = {};
  classes.items.forEach(c => { const y=c.academicYear||"Unknown"; byYear[y]=(byYear[y]||0)+1; });
  const yearBars = Object.entries(byYear).map(([k,v]) => ({ label:k, value:v, color:"var(--brand)" }));

  // Classes by subject
  const bySubject = {};
  classes.items.forEach(c => { const s=c.subject||"Other"; bySubject[s]=(bySubject[s]||0)+1; });
  const subjectBars = Object.entries(bySubject).slice(0,8).map(([k,v]) => ({ label:k, value:v, color:"#2563eb" }));

  return (
    <div>
      <div className="page-hd">
        <div><h2>Analytics</h2><p>Platform statistics at a glance</p></div>
      </div>

      <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
        {[
          { label:"Total users",    value:users.total,          color:"var(--brand)" },
          { label:"Active rate",    value:`${activeRate}%`,     color:"#059669" },
          { label:"Total classes",  value:classes.items.length, color:"#2563eb" },
          { label:"Academic years", value:Object.keys(byYear).length, color:"#d97706" },
        ].map(s => (
          <div className="card card-pad stat-card" key={s.label}>
            <div className="stat-val" style={{color:s.color}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overview-2col">
        <div className="card card-pad">
          <h3 style={{margin:"0 0 1.25rem",fontSize:"1rem",fontWeight:700}}>Users by Role</h3>
          <BarChart data={byRole} height={160} />
        </div>
        <div className="card card-pad">
          <h3 style={{margin:"0 0 1.25rem",fontSize:"1rem",fontWeight:700}}>Classes by Year</h3>
          {yearBars.length ? <BarChart data={yearBars} height={160} /> : <p style={{color:"var(--text-3)"}}>No data</p>}
        </div>
        <div className="card card-pad" style={{gridColumn:"1 / -1"}}>
          <h3 style={{margin:"0 0 1.25rem",fontSize:"1rem",fontWeight:700}}>Classes by Subject</h3>
          {subjectBars.length ? <BarChart data={subjectBars} height={160} /> : <p style={{color:"var(--text-3)"}}>No data</p>}
        </div>
      </div>
    </div>
  );
}
