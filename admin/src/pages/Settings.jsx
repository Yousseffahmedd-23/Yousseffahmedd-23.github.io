import { useEffect, useState } from "react";
import * as api from "../api/adminApi.js";

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [val,      setVal]      = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  const load = () => {
    api.getSettings().then(d => setSettings(d.items)).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load, []);

  async function handleSave(key) {
    setSaving(true);
    try {
      await api.updateSetting(key, val);
      setMsg("Saved!"); setEditing(null); load();
      setTimeout(() => setMsg(""), 2000);
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-hd">
        <div><h2>System Settings</h2><p>Key-value configuration stored in the database</p></div>
      </div>
      {msg && <div style={{marginBottom:"1rem",padding:".75rem",background:"#ecfdf5",borderRadius:6,color:"#059669"}}>{msg}</div>}
      <div className="card">
        {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--text-3)"}}>Loading…</div>}
        {!loading && settings.length === 0 && (
          <div style={{padding:"2rem",textAlign:"center",color:"var(--text-3)"}}>
            No settings configured yet. Settings can be added via API: PUT /api/admin/settings/:key
          </div>
        )}
        {settings.map((s, i) => (
          <div key={s._id} style={{padding:"1rem 1.5rem",borderBottom:i<settings.length-1?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
            <div style={{flex:"0 0 180px",fontWeight:600,fontSize:".875rem"}}>{s.key}</div>
            {editing === s.key ? (
              <>
                <input className="input" style={{flex:1}} value={val} onChange={e=>setVal(e.target.value)} autoFocus />
                <button className="btn btn-primary btn-sm" onClick={()=>handleSave(s.key)} disabled={saving}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{flex:1,color:"var(--text-2)",fontSize:".875rem"}}>{String(s.value)}</span>
                <button className="btn btn-secondary btn-sm" onClick={()=>{ setEditing(s.key); setVal(String(s.value)); }}>Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
