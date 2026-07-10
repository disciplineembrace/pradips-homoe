"""Build admin.html — standalone admin panel for Pradip's Homoe."""

HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>Admin Console — Pradip's Homoe</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bottle:#1E3A2B; --brass:#B08D3F; --parchment:#F3EBDA; --parchment-dark:#E8DCC3;
  --maroon:#6E2A3A; --sage:#7C8F6E; --ink:#2B2420; --danger:#c44; --success:#2a7;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#0f1a14;color:#e8dcc3;min-height:100vh}
a{color:var(--brass);text-decoration:none}
a:hover{text-decoration:underline}

/* LOGIN */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.login-card{background:#fffdf8;color:var(--ink);border-radius:16px;padding:40px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.login-card h1{font-family:Fraunces,serif;color:var(--bottle);text-align:center;font-size:1.8rem;margin-bottom:4px}
.login-card .sub{text-align:center;font-size:.82rem;color:#888;margin-bottom:28px;font-family:IBM Plex Mono,monospace;letter-spacing:.05em;text-transform:uppercase}
.login-card .badge{display:inline-block;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:12px;font-size:.7rem;font-weight:600;margin:0 auto 20px;letter-spacing:.05em;text-transform:uppercase}
.login-card .badge-wrap{text-align:center;margin-bottom:24px}
.login-card label{display:block;font-size:.78rem;font-weight:600;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.login-card input{width:100%;padding:14px;border:2px solid #e0d8c8;border-radius:8px;font-size:1rem;margin-bottom:14px;font-family:inherit;transition:border-color .2s}
.login-card input:focus{outline:none;border-color:var(--bottle)}
.login-card input.code{font-family:IBM Plex Mono,monospace;font-size:1.2rem;text-align:center;letter-spacing:.4em}
.login-card .btn{width:100%;padding:14px;background:var(--bottle);color:#fff;border:none;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;transition:all .2s}
.login-card .btn:hover{background:#2a4f3b;transform:translateY(-1px)}
.login-card .err{color:var(--danger);font-size:.85rem;text-align:center;margin:10px 0;min-height:20px}
.login-card .hint{margin-top:18px;padding:12px;background:#fef9e7;border-radius:6px;font-size:.78rem;color:#92400e;line-height:1.5}
.login-card .hint b{color:#78350f}
.login-card .footer{margin-top:24px;text-align:center;font-size:.75rem;color:#999;font-family:IBM Plex Mono,monospace}

/* DASHBOARD */
.dash{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
.sidebar{background:#0a1410;padding:24px 0;border-right:1px solid #1f2a25}
.sidebar .brand{padding:0 24px 24px;border-bottom:1px solid #1f2a25;margin-bottom:16px}
.sidebar .brand h2{font-family:Fraunces,serif;color:var(--brass);font-size:1.3rem;font-style:italic}
.sidebar .brand .small{font-size:.7rem;color:#999;font-family:IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
.sidebar .nav-item{padding:12px 24px;color:#a8b5ac;cursor:pointer;font-size:.88rem;font-weight:500;transition:all .2s;border-left:3px solid transparent;display:flex;align-items:center;gap:10px}
.sidebar .nav-item:hover{background:rgba(176,141,63,.08);color:#e8dcc3}
.sidebar .nav-item.active{background:rgba(176,141,63,.12);color:var(--brass);border-left-color:var(--brass)}
.sidebar .nav-item .ico{font-size:1.1rem;width:20px;text-align:center}
.sidebar .user-info{padding:16px 24px;border-top:1px solid #1f2a25;margin-top:auto;position:absolute;bottom:0;width:260px}
.sidebar .user-info .name{font-size:.85rem;color:#e8dcc3;font-weight:600}
.sidebar .user-info .role{font-size:.7rem;color:var(--brass);font-family:IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.1em}
.sidebar .user-info .logout{margin-top:8px;color:#a88;font-size:.75rem;cursor:pointer;display:inline-block}
.sidebar .user-info .logout:hover{color:var(--danger);text-decoration:underline}

.main{padding:32px 40px;overflow-y:auto;max-height:100vh}
.page-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.page-head h1{font-family:Fraunces,serif;font-size:1.8rem;color:#fff;font-weight:400}
.page-head .meta{font-size:.78rem;color:#888;font-family:IBM Plex Mono,monospace}

.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px}
.stat-card{background:#15241c;border:1px solid #1f2a25;border-radius:10px;padding:20px}
.stat-card .label{font-size:.7rem;color:#888;text-transform:uppercase;letter-spacing:.1em;font-family:IBM Plex Mono,monospace;margin-bottom:8px}
.stat-card .value{font-size:2rem;font-weight:700;color:var(--brass);font-family:Fraunces,serif}
.stat-card .sub{font-size:.75rem;color:#a8b5ac;margin-top:4px}

.panel{background:#15241c;border:1px solid #1f2a25;border-radius:10px;padding:24px;margin-bottom:24px}
.panel h2{font-family:Fraunces,serif;font-size:1.2rem;color:var(--brass);margin-bottom:16px;font-weight:600}
.panel h2 .sub{font-size:.75rem;color:#888;font-family:IBM Plex Mono,monospace;margin-left:8px;font-weight:400}

table{width:100%;border-collapse:collapse;font-size:.85rem}
table th{background:#0a1410;padding:12px;text-align:left;font-weight:600;color:var(--brass);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid var(--brass)}
table td{padding:12px;border-bottom:1px solid #1f2a25;color:#c8d4ca}
table tr:hover td{background:rgba(176,141,63,.04)}
.role-tag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.role-super_admin{background:#7c2d12;color:#fed7aa}
.role-admin{background:#1e3a8a;color:#bfdbfe}
.role-user{background:#064e3b;color:#a7f3d0}
.status-active{color:#86efac}
.status-disabled{color:#fca5a5}

.btn{padding:8px 14px;background:var(--bottle);color:#fff;border:none;border-radius:6px;font-size:.82rem;cursor:pointer;font-weight:500;transition:all .2s;font-family:inherit}
.btn:hover{background:#2a4f3b}
.btn-danger{background:#7c2d12}
.btn-danger:hover{background:#9a3a18}
.btn-sm{padding:5px 10px;font-size:.75rem}
.btn-brass{background:var(--brass);color:#0a1410}
.btn-brass:hover{background:#c89e4a}

.log-entry{padding:10px 12px;border-left:3px solid #1f2a25;margin-bottom:6px;font-size:.82rem;font-family:IBM Plex Mono,monospace}
.log-entry .ts{color:#888;margin-right:10px}
.log-entry .event{color:var(--brass);font-weight:600;margin-right:10px}
.log-entry .ip{color:#a8b5ac}
.log-entry.warn{border-left-color:#f59e0b}
.log-entry.error{border-left-color:var(--danger)}
.log-entry.success{border-left-color:var(--success)}

.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-field label{display:block;font-size:.75rem;color:#a8b5ac;margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.form-field input,.form-field select{width:100%;padding:10px 12px;background:#0a1410;border:1px solid #1f2a25;border-radius:6px;color:#e8dcc3;font-size:.9rem;font-family:inherit}
.form-field input:focus{outline:none;border-color:var(--brass)}
.form-field input.code{font-family:IBM Plex Mono,monospace;letter-spacing:.3em;text-align:center}
.form-actions{display:flex;gap:10px;margin-top:16px}

.alert{padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:.85rem}
.alert-success{background:rgba(34,197,94,.1);color:#86efac;border:1px solid rgba(34,197,94,.3)}
.alert-error{background:rgba(220,38,38,.1);color:#fca5a5;border:1px solid rgba(220,38,38,.3)}
.alert-info{background:rgba(176,141,63,.1);color:#fde68a;border:1px solid rgba(176,141,63,.3)}

.empty{text-align:center;padding:40px;color:#666;font-style:italic}

@media(max-width:768px){
  .dash{grid-template-columns:1fr}
  .sidebar{display:none}
  .main{padding:20px}
  .form-row{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- LOGIN VIEW -->
<div id="loginView" class="login-wrap">
  <div class="login-card">
    <h1>Admin Console</h1>
    <div class="sub">Pradip's Homoe</div>
    <div class="badge-wrap"><span class="badge">Restricted Access</span></div>
    
    <label>Username / Email</label>
    <input type="text" id="loginUser" placeholder="admin@example.com" autocomplete="off"/>
    
    <label>6-Digit Code</label>
    <input type="password" id="loginCode" class="code" maxlength="6" placeholder="------" inputmode="numeric" autocomplete="one-time-code"/>
    
    <div class="err" id="loginErr"></div>
    <button class="btn" onclick="doLogin()">Authenticate</button>
    
    <div class="hint">
      <b>Authorized personnel only.</b> All access attempts are logged. 5 failed attempts will lock your IP for 15 minutes.
    </div>
    
    <div class="footer">v1.0 · HTTPS · CSRF Protected</div>
  </div>
</div>

<!-- DASHBOARD VIEW -->
<div id="dashView" class="dash" style="display:none">
  <aside class="sidebar">
    <div class="brand">
      <h2>Pradip's Homoe</h2>
      <div class="small">Admin Console</div>
    </div>
    <div class="nav-item active" onclick="showSection('overview',this)"><span class="ico">○</span> Overview</div>
    <div class="nav-item" onclick="showSection('users',this)"><span class="ico">◑</span> Users</div>
    <div class="nav-item" onclick="showSection('security',this)"><span class="ico">⚿</span> Security Codes</div>
    <div class="nav-item" onclick="showSection('logs',this)"><span class="ico">≡</span> Audit Logs</div>
    <div class="nav-item" onclick="showSection('settings',this)"><span class="ico">⚙</span> Settings</div>
    <div class="user-info">
      <div class="name" id="adminName">—</div>
      <div class="role" id="adminRole">—</div>
      <div class="logout" onclick="doLogout()">↩ Logout</div>
    </div>
  </aside>
  
  <main class="main">
    <div id="alertArea"></div>
    
    <!-- OVERVIEW -->
    <div id="sec-overview" class="section">
      <div class="page-head">
        <h1>Overview</h1>
        <div class="meta" id="overviewMeta">—</div>
      </div>
      <div class="stats" id="statsGrid"></div>
      <div class="panel">
        <h2>System Status <span class="sub">real-time</span></h2>
        <div id="sysStatus">Loading...</div>
      </div>
    </div>
    
    <!-- USERS -->
    <div id="sec-users" class="section" style="display:none">
      <div class="page-head">
        <h1>Users</h1>
        <div class="meta"><button class="btn btn-sm" onclick="loadUsers()">↻ Refresh</button></div>
      </div>
      <div class="panel">
        <h2>Registered Users <span class="sub" id="userCount"></span></h2>
        <div id="usersTable">Loading...</div>
      </div>
    </div>
    
    <!-- SECURITY CODES -->
    <div id="sec-security" class="section" style="display:none">
      <div class="page-head">
        <h1>Security Codes</h1>
        <div class="meta">Section access control</div>
      </div>
      <div class="panel">
        <h2>Change User Access Code</h2>
        <p style="font-size:.82rem;color:#a8b5ac;margin-bottom:16px">This code unlocks protected sections for normal users.</p>
        <div class="form-row">
          <div class="form-field">
            <label>New 6-digit code</label>
            <input type="password" id="newUserCode" class="code" maxlength="6" placeholder="------" inputmode="numeric"/>
          </div>
          <div class="form-field">
            <label>Confirm code</label>
            <input type="password" id="newUserCode2" class="code" maxlength="6" placeholder="------" inputmode="numeric"/>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn" onclick="changeUserCode()">Update User Code</button>
        </div>
      </div>
      <div class="panel">
        <h2>Change Admin Access Code</h2>
        <p style="font-size:.82rem;color:#a8b5ac;margin-bottom:16px">This code is required to access this admin console.</p>
        <div class="form-row">
          <div class="form-field">
            <label>New 6-digit code</label>
            <input type="password" id="newAdminCode" class="code" maxlength="6" placeholder="------" inputmode="numeric"/>
          </div>
          <div class="form-field">
            <label>Confirm code</label>
            <input type="password" id="newAdminCode2" class="code" maxlength="6" placeholder="------" inputmode="numeric"/>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-danger" onclick="changeAdminCode()">Update Admin Code</button>
        </div>
      </div>
      <div class="panel">
        <h2>Security Question (for code recovery)</h2>
        <div class="form-row">
          <div class="form-field">
            <label>Question</label>
            <input type="text" id="secQuestion" placeholder="e.g. What is your favourite food?"/>
          </div>
          <div class="form-field">
            <label>Answer</label>
            <input type="text" id="secAnswer" placeholder="Answer"/>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn" onclick="changeSecQuestion()">Update Question</button>
        </div>
      </div>
    </div>
    
    <!-- LOGS -->
    <div id="sec-logs" class="section" style="display:none">
      <div class="page-head">
        <h1>Audit Logs</h1>
        <div class="meta"><button class="btn btn-sm" onclick="loadLogs()">↻ Refresh</button></div>
      </div>
      <div class="panel">
        <h2>Recent Activity <span class="sub">last 50 events</span></h2>
        <div id="logsList">Loading...</div>
      </div>
    </div>
    
    <!-- SETTINGS -->
    <div id="sec-settings" class="section" style="display:none">
      <div class="page-head">
        <h1>Settings</h1>
        <div class="meta">Console configuration</div>
      </div>
      <div class="panel">
        <h2>Admin Profile</h2>
        <div id="profileInfo">Loading...</div>
      </div>
      <div class="panel">
        <h2>Session</h2>
        <div id="sessionInfo">Loading...</div>
      </div>
      <div class="panel">
        <h2>Danger Zone</h2>
        <p style="font-size:.85rem;color:#a8b5ac;margin-bottom:12px">Logout from current session. You'll need to authenticate again.</p>
        <button class="btn btn-danger" onclick="doLogout()">Logout Now</button>
      </div>
    </div>
    
  </main>
</div>

<script>
let _csrf = null;
let _session = null;

// ============ LOGIN ============
async function getCSRF(){
  if (_csrf) return _csrf;
  try {
    const r = await fetch('/api/account?action=csrf', {credentials:'include'});
    const d = await r.json();
    _csrf = d.csrf;
    return _csrf;
  } catch(e) { return null; }
}

async function doLogin(){
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const c = document.getElementById('loginCode').value.trim();
  const err = document.getElementById('loginErr');
  if (!u || !/^\\d{6}$/.test(c)) { err.textContent = 'Username and 6-digit code required.'; return; }
  err.textContent = 'Authenticating...';
  
  const csrf = await getCSRF();
  try {
    const r = await fetch('/api/account?action=login', {
      credentials:'include',
      method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},
      body: JSON.stringify({username:u, code:c, _csrf:csrf})
    });
    const d = await r.json();
    if (d.success && ['super_admin','admin'].includes(d.role)) {
      _session = d;
      _csrf = d.csrf;
      err.textContent = '';
      showDashboard();
    } else if (d.success) {
      err.textContent = 'Access denied. Admin role required.';
    } else {
      const ar = d.ar ? ' (' + d.ar + ' attempts remaining)' : '';
      err.textContent = (d.error || 'Login failed') + ar;
    }
  } catch(e) {
    err.textContent = 'Connection error. Check your network.';
  }
}

async function doLogout(){
  try {
    await fetch('/api/account?action=logout', {credentials:'include', method:'POST', headers:{'X-CSRF-Token':_csrf||''}});
  } catch(e) {}
  _session = null;
  _csrf = null;
  document.getElementById('dashView').style.display = 'none';
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('loginCode').value = '';
  document.getElementById('loginErr').textContent = '';
}

// Enter key for login
document.getElementById('loginCode').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('loginUser').addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('loginCode').focus(); });

// ============ DASHBOARD ============
async function showDashboard(){
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashView').style.display = 'grid';
  document.getElementById('adminName').textContent = _session.fullName || _session.username;
  document.getElementById('adminRole').textContent = _session.role.replace('_',' ');
  document.getElementById('overviewMeta').textContent = new Date().toLocaleString();
  await loadOverview();
}

function showSection(name, el){
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('sec-' + name).style.display = 'block';
  if (el) el.classList.add('active');
  
  if (name === 'overview') loadOverview();
  else if (name === 'users') loadUsers();
  else if (name === 'security') loadSecurityStatus();
  else if (name === 'logs') loadLogs();
  else if (name === 'settings') loadSettings();
}

function showAlert(type, msg){
  const a = document.getElementById('alertArea');
  a.innerHTML = '<div class="alert alert-' + type + '">' + msg + '</div>';
  setTimeout(() => a.innerHTML = '', 4000);
}

async function loadOverview(){
  // Stats
  try {
    const [usersResp, statusResp, logsResp] = await Promise.all([
      fetch('/api/account?action=admin_list', {credentials:'include'}).then(r=>r.json()),
      fetch('/api/security?action=admin_status', {credentials:'include'}).then(r=>r.json()),
      fetch('/api/security?action=admin_logs', {credentials:'include'}).then(r=>r.json())
    ]);
    
    const userCount = (usersResp.users || []).length;
    const adminCount = (usersResp.users || []).filter(u => ['admin','super_admin'].includes(u.role)).length;
    const activeCount = (usersResp.users || []).filter(u => u.status === 'active').length;
    const logCount = (logsResp.logs || []).length;
    const failCount = (logsResp.logs || []).filter(l => l.event && (l.event.includes('fail') || l.event.includes('locked'))).length;
    
    document.getElementById('statsGrid').innerHTML = [
      ['Total Users', userCount, adminCount + ' admins'],
      ['Active', activeCount, (userCount - activeCount) + ' disabled'],
      ['Audit Events', logCount, failCount + ' failures'],
      ['Protection', statusResp.protection_enabled ? 'ON' : 'OFF', (statusResp.protected_sections || []).length + ' sections']
    ].map(s => '<div class="stat-card"><div class="label">' + s[0] + '</div><div class="value">' + s[1] + '</div><div class="sub">' + s[2] + '</div></div>').join('');
    
    // System status
    document.getElementById('sysStatus').innerHTML = 
      '<table><tbody>' +
      row('Protection Enabled', statusResp.protection_enabled ? '<span class="status-active">Yes</span>' : '<span class="status-disabled">No</span>') +
      row('Session Expiry', statusResp.session_expiry_minutes + ' minutes') +
      row('Protected Sections', (statusResp.protected_sections || []).join(', ')) +
      row('Security Question', statusResp.security_question || '—') +
      row('User Code Set', statusResp.has_user_code ? '<span class="status-active">Yes</span>' : '<span class="status-disabled">No</span>') +
      row('Admin Code Set', statusResp.has_admin_code ? '<span class="status-active">Yes</span>' : '<span class="status-disabled">No</span>') +
      '</tbody></table>';
  } catch(e) {
    document.getElementById('sysStatus').innerHTML = '<div class="empty">Failed to load status: ' + e.message + '</div>';
  }
}

function row(label, value){
  return '<tr><td style="color:#a8b5ac;width:240px">' + label + '</td><td>' + value + '</td></tr>';
}

async function loadUsers(){
  try {
    const r = await fetch('/api/account?action=admin_list', {credentials:'include'});
    const d = await r.json();
    if (d.error) { document.getElementById('usersTable').innerHTML = '<div class="empty">' + d.error + '</div>'; return; }
    const users = d.users || [];
    document.getElementById('userCount').textContent = users.length + ' total';
    document.getElementById('usersTable').innerHTML = 
      '<table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead><tbody>' +
      users.map(u => '<tr>' +
        '<td><b>' + esc(u.username) + '</b></td>' +
        '<td>' + esc(u.fullName || '—') + '</td>' +
        '<td><span class="role-tag role-' + u.role + '">' + u.role + '</span></td>' +
        '<td class="status-' + u.status + '">' + u.status + '</td>' +
        '<td>' + (u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never') + '</td>' +
        '<td><button class="btn btn-sm" onclick="resetPassword(\\'' + esc(u.username) + '\\')">Reset Code</button></td>' +
      '</tr>').join('') +
      '</tbody></table>';
  } catch(e) {
    document.getElementById('usersTable').innerHTML = '<div class="empty">Failed to load users</div>';
  }
}

async function resetPassword(username){
  const nc = prompt('Enter new 6-digit code for ' + username + ':');
  if (!nc) return;
  if (!/^\\d{6}$/.test(nc)) { alert('Code must be exactly 6 digits.'); return; }
  try {
    const r = await fetch('/api/account?action=admin_reset_password', {
      credentials:'include', method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':_csrf||''},
      body: JSON.stringify({username, new_code:nc, _csrf})
    });
    const d = await r.json();
    if (d.success) showAlert('success', 'Password reset for ' + username);
    else showAlert('error', d.error || 'Reset failed');
  } catch(e) { showAlert('error', 'Connection error'); }
}

async function loadSecurityStatus(){
  try {
    const r = await fetch('/api/security?action=admin_status', {credentials:'include'});
    const d = await r.json();
    if (d.error) return;
    document.getElementById('secQuestion').value = d.security_question || '';
  } catch(e) {}
}

async function changeUserCode(){
  const c1 = document.getElementById('newUserCode').value;
  const c2 = document.getElementById('newUserCode2').value;
  if (c1 !== c2) { showAlert('error', 'Codes do not match'); return; }
  if (!/^\\d{6}$/.test(c1)) { showAlert('error', 'Code must be 6 digits'); return; }
  try {
    const r = await fetch('/api/security?action=admin_change_user_code', {
      credentials:'include', method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':_csrf||''},
      body: JSON.stringify({new_code:c1, _csrf})
    });
    const d = await r.json();
    if (d.success) { showAlert('success', 'User code updated'); document.getElementById('newUserCode').value=''; document.getElementById('newUserCode2').value=''; }
    else showAlert('error', d.error || 'Failed');
  } catch(e) { showAlert('error', 'Connection error'); }
}

async function changeAdminCode(){
  const c1 = document.getElementById('newAdminCode').value;
  const c2 = document.getElementById('newAdminCode2').value;
  if (c1 !== c2) { showAlert('error', 'Codes do not match'); return; }
  if (!/^\\d{6}$/.test(c1)) { showAlert('error', 'Code must be 6 digits'); return; }
  if (!confirm('Change admin code? You will need the new code next time you log in.')) return;
  try {
    const r = await fetch('/api/security?action=admin_change_admin_code', {
      credentials:'include', method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':_csrf||''},
      body: JSON.stringify({new_code:c1, _csrf})
    });
    const d = await r.json();
    if (d.success) { showAlert('success', 'Admin code updated'); document.getElementById('newAdminCode').value=''; document.getElementById('newAdminCode2').value=''; }
    else showAlert('error', d.error || 'Failed');
  } catch(e) { showAlert('error', 'Connection error'); }
}

async function changeSecQuestion(){
  const q = document.getElementById('secQuestion').value.trim();
  const a = document.getElementById('secAnswer').value.trim();
  if (!q || !a) { showAlert('error', 'Question and answer required'); return; }
  try {
    const r = await fetch('/api/security?action=admin_change_question', {
      credentials:'include', method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':_csrf||''},
      body: JSON.stringify({question:q, answer:a, _csrf})
    });
    const d = await r.json();
    if (d.success) { showAlert('success', 'Security question updated'); document.getElementById('secAnswer').value=''; }
    else showAlert('error', d.error || 'Failed');
  } catch(e) { showAlert('error', 'Connection error'); }
}

async function loadLogs(){
  try {
    const r = await fetch('/api/security?action=admin_logs', {credentials:'include'});
    const d = await r.json();
    const logs = d.logs || [];
    if (!logs.length) { document.getElementById('logsList').innerHTML = '<div class="empty">No audit events yet</div>'; return; }
    document.getElementById('logsList').innerHTML = logs.map(l => {
      const ev = l.event || 'event';
      let cls = '';
      if (ev.includes('fail') || ev.includes('locked') || ev.includes('error')) cls = 'error';
      else if (ev.includes('login') || ev.includes('success')) cls = 'success';
      else if (ev.includes('warn')) cls = 'warn';
      const ts = l.ts ? new Date(l.ts).toLocaleString() : (l.timestamp ? new Date(l.timestamp).toLocaleString() : '—');
      return '<div class="log-entry ' + cls + '"><span class="ts">' + ts + '</span><span class="event">' + ev + '</span><span class="ip">' + (l.ip || '') + '</span>' + (l.detail ? ' <span style="color:#888">— ' + esc(l.detail) + '</span>' : '') + '</div>';
    }).join('');
  } catch(e) {
    document.getElementById('logsList').innerHTML = '<div class="empty">Failed to load logs</div>';
  }
}

async function loadSettings(){
  document.getElementById('profileInfo').innerHTML = 
    '<table><tbody>' +
    row('Username', _session.username) +
    row('Full Name', _session.fullName || '—') +
    row('Role', '<span class="role-tag role-' + _session.role + '">' + _session.role + '</span>') +
    '</tbody></table>';
  document.getElementById('sessionInfo').innerHTML = 
    '<table><tbody>' +
    row('Session Active', '<span class="status-active">Yes</span>') +
    row('CSRF Protected', 'Yes') +
    row('Logged In At', new Date().toLocaleString()) +
    '</tbody></table>';
}

function esc(s){
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============ INIT ============
// Check if already logged in
(async function(){
  try {
    const r = await fetch('/api/account?action=check', {credentials:'include'});
    const d = await r.json();
    if (d.authenticated && ['super_admin','admin'].includes(d.role)) {
      _session = d;
      _csrf = d.csrf;
      showDashboard();
    }
  } catch(e) {}
})();
</script>
</body>
</html>
'''

with open('/home/z/my-project/vercel-deploy/admin.html', 'w') as f:
    f.write(HTML)
print(f'admin.html written: {len(HTML):,} bytes')
