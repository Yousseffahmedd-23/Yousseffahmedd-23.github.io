import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";

function StatCard({ label, value, sub, color = "var(--brand)" }) {
  return (
    <div className="card card-pad stat-card">
      <div className="stat-val" style={{ color }}>{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, pct, color }) {
  return (
    <div style={{ marginBottom: ".75rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:".8rem", marginBottom:".3rem" }}>
        <span>{label}</span><span style={{ fontWeight:600 }}>{pct}%</span>
      </div>
      <div style={{ background:"#e5e7eb", borderRadius:9999, height:8 }}>
        <div style={{ width:`${pct}%`, background:color || "var(--brand)", borderRadius:9999, height:8, transition:"width .5s" }}/>
      </div>
    </div>
  );
}

export default function Overview() {
  const [users,   setUsers]   = useState(null);
  const [classes, setClasses] = useState(null);
  const [health,  setHealth]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.listUsers({ limit: 100 }),
      api.listClasses(),
      api.getHealth(),
    ]).then(([u, c, h]) => {
      if (u.status === "fulfilled") setUsers(u.value);
      if (c.status === "fulfilled") setClasses(c.value);
      if (h.status === "fulfilled") setHealth(h.value);
      setLoading(false);
    });
  }, []);

  // Listen for realtime sync to refresh counts
  useEffect(() => {
    const refresh = () => {
      api.listUsers({ limit: 100 }).then(setUsers).catch(() => {});
      api.listClasses().then(setClasses).catch(() => {});
    };
    window.addEventListener("sabboora:school-sync", refresh);
    return () => window.removeEventListener("sabboora:school-sync", refresh);
  }, []);

  const teachers = users?.items?.filter(u => u.role === "teacher").length ?? 0;
  const students = users?.items?.filter(u => u.role === "student").length ?? 0;
  const parents  = users?.items?.filter(u => u.role === "parent" ).length ?? 0;
  const admins   = users?.items?.filter(u => u.role === "admin"  ).length ?? 0;
  const totalUsers  = users?.total ?? 0;
  const totalClasses= classes?.items?.length ?? 0;

  const activeUsers = users?.items?.filter(u => u.isActive).length ?? 0;
  const activeRate  = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const roleBreakdown = [
    { label: "Students",  pct: totalUsers ? Math.round((students / totalUsers) * 100) : 0, color: "#2563eb" },
    { label: "Teachers",  pct: totalUsers ? Math.round((teachers / totalUsers) * 100) : 0, color: "#059669" },
    { label: "Parents",   pct: totalUsers ? Math.round((parents  / totalUsers) * 100) : 0, color: "#d97706" },
  ];

  if (loading) return <div className="empty-state">Loading overview…</div>;

  return (
    <div>
      <div className="page-hd">
        <div>
          <h2>Dashboard Overview</h2>
          <p>School platform statistics and quick summary</p>
        </div>
        <span className={`badge ${health?.ok ? "badge-green" : "badge-red"}`}>
          {health?.ok ? "● API Online" : "● API Offline"}
        </span>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard label="Total Users"    value={totalUsers}  sub={`${activeRate}% active`} />
        <StatCard label="Teachers"       value={teachers}    color="#059669" />
        <StatCard label="Students"       value={students}    color="#2563eb" />
        <StatCard label="Parents"        value={parents}     color="#d97706" />
        <StatCard label="Admins"         value={admins}      color="#7c3aed" />
        <StatCard label="Active Classes" value={totalClasses} color="var(--brand)" />
      </div>

      {/* Two-column info row */}
      <div className="overview-2col">
        {/* Role breakdown */}
        <div className="card card-pad">
          <h3 style={{ margin:"0 0 1.25rem", fontSize:"1rem", fontWeight:700 }}>User Breakdown</h3>
          {roleBreakdown.map(r => (
            <MiniBar key={r.label} label={r.label} pct={r.pct} color={r.color} />
          ))}
          <div style={{ marginTop:"1rem", fontSize:".8rem", color:"var(--text-3)" }}>
            Active users: {activeUsers} / {totalUsers}
          </div>
        </div>

        {/* Recent classes */}
        <div className="card card-pad">
          <h3 style={{ margin:"0 0 1.25rem", fontSize:"1rem", fontWeight:700 }}>Recent Classes</h3>
          {classes?.items?.length === 0 && <p style={{ color:"var(--text-3)", fontSize:".875rem" }}>No classes yet.</p>}
          {classes?.items?.slice(0, 6).map(c => (
            <div key={c._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:".5rem 0", borderBottom:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight:600, fontSize:".875rem" }}>{c.name}</div>
                <div style={{ fontSize:".78rem", color:"var(--text-3)" }}>{c.subject} · {c.gradeLevel} · {c.academicYear}</div>
              </div>
              <span className="badge badge-green">{c.teacherIds?.length ?? 0} teachers</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
