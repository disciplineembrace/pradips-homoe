const crypto=require('crypto');
function hashP(p){const s=crypto.randomBytes(16).toString('hex');const d=crypto.pbkdf2Sync(String(p),s,100000,32,'sha256');return'pbkdf2$100000$'+s+'$'+d.toString('hex');}
function verifyP(p,s){try{if(!s)return false;const ps=s.split('$');if(ps.length!==4||ps[0]!=='pbkdf2')return false;const d=crypto.pbkdf2Sync(String(p),ps[2],parseInt(ps[1]),32,'sha256');return crypto.timingSafeEqual(Buffer.from(ps[3],'hex'),d);}catch(e){return false;}}
function san(s){return typeof s==='string'?s.trim().replace(/[<>'"]/g,''):'';}
function isCode(c){return/^\d{6}$/.test(String(c));}
const _u=new Map(),_ss=new Map(),_rl=new Map(),_a=[];
let _i=false;
const DU=[{username:'sagathiyapradip2002@gmail.com',fullName:'Pradip Sagathiya',email:'sagathiyapradip2002@gmail.com',mobile:'',passwordHash:'pbkdf2$100000$b08016c2078313a6d1d5a244c7cadec6$1a2f6bea3d8310824bae9172400541bde2b614bd8bc5904afa7ff0a710fca42d',role:'super_admin',status:'active',forcePasswordChange:false,createdAt:new Date().toISOString(),lastLogin:null},{username:'pradip',fullName:'Pradip (User)',email:'',mobile:'',passwordHash:'pbkdf2$100000$bc2325a68f3b4f402fa2f302ecd2d1f7$76b87b0e55befdffdfaf6c61839a20a0911e67a1781c84e81d7345fe33250707',role:'user',status:'active',forcePasswordChange:false,createdAt:new Date().toISOString(),lastLogin:null}];
function init(){if(_i)return;_i=true;DU.forEach(u=>_u.set(u.username.toLowerCase(),{...u}));}
const CK='ph_acc_session',EXP=60;
function sj(r,c,d){r.setHeader('Content-Type','application/json');r.status(c).json(d);}
function sc(r,t,m){r.setHeader('Set-Cookie',CK+'='+t+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+m*60);}
function cc(r){r.setHeader('Set-Cookie',CK+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');}
function gT(r){const c=r.headers.cookie||'';const m=c.match(new RegExp(CK+'=([^;]+)'));return m?m[1]:null;}
function gS(r){const t=gT(r);if(!t)return null;const s=_ss.get(t);if(!s)return null;if(Date.now()>s.expiresAt){_ss.delete(t);return null;}return s;}
function gIP(r){return(r.headers['x-forwarded-for']||'').split(',')[0].trim()||'unknown';}
function vC(r,s){const c=r.headers['x-csrf-token']||(r.body&&r.body._csrf)||'';return s&&s.csrf===c;}
function cRL(u,ip){const n=Date.now();const k=u+'_'+ip;let e=_rl.get(k);if(e&&e.lockedUntil&&n<e.lockedUntil)return{allowed:false,rm:Math.ceil((e.lockedUntil-n)/60000)};if(e&&e.lockedUntil&&n>=e.lockedUntil){e=null;_rl.delete(k);}if(!e||(n-e.firstAttempt)>900000)e={count:0,firstAttempt:n,lockedUntil:null};e.count++;_rl.set(k,e);if(e.count>=5){e.lockedUntil=n+900000;_rl.set(k,e);return{allowed:false,rm:15};}return{allowed:true,ar:5-e.count};}
function rRL(u,ip){_rl.delete(u+'_'+ip);}
module.exports=async(req,res)=>{
res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,X-CSRF-Token');res.setHeader('X-Content-Type-Options','nosniff');
if(req.method==='OPTIONS')return res.status(204).end();init();
const a=req.query.action||'';const ip=gIP(req);let body={};try{body=(req.body&&typeof req.body==='object')?req.body:(typeof req.body==='string'?JSON.parse(req.body):{});}catch(e){body={};}
if(req.method==='GET'&&a==='csrf')return sj(res,200,{csrf:crypto.randomBytes(16).toString('hex')});
if(req.method==='GET'&&a==='check'){const s=gS(req);if(!s)return sj(res,200,{authenticated:false});const u=_u.get(s.username.toLowerCase());return sj(res,200,{authenticated:true,username:s.username,fullName:u?u.fullName:'',role:u?u.role:'user',csrf:s.csrf});}
if(req.method==='POST'&&a==='login'){const u=san(body.username).toLowerCase();const c=san(body.code);if(!u||!isCode(c))return sj(res,400,{error:'Username+6-digit code.'});const rl=cRL(u,ip);if(!rl.allowed)return sj(res,429,{error:'Locked '+rl.rm+'min.'});const user=_u.get(u);if(!user)return sj(res,401,{error:'Invalid.',ar:rl.ar});if(user.status!=='active')return sj(res,403,{error:'Disabled.'});if(!verifyP(c,user.passwordHash))return sj(res,401,{error:'Invalid.',ar:rl.ar});rRL(u,ip);const csrf=crypto.randomBytes(16).toString('hex');const t=crypto.randomBytes(32).toString('hex');_ss.set(t,{username:u,ip,csrf,createdAt:Date.now(),expiresAt:Date.now()+EXP*60000});sc(res,t,EXP);user.lastLogin=new Date().toISOString();return sj(res,200,{success:true,csrf,username:u,fullName:user.fullName,role:user.role});}
if(req.method==='POST'&&a==='logout'){const t=gT(req);if(t)_ss.delete(t);cc(res);return sj(res,200,{success:true});}
function rA(req){const s=gS(req);if(!s)return null;const u=_u.get(s.username.toLowerCase());if(!u||u.status!=='active'||!['super_admin','admin'].includes(u.role))return null;return{session:s,user:u};}
if(req.method==='GET'&&a==='admin_list'){const a2=rA(req);if(!a2)return sj(res,403,{error:'Admin.'});return sj(res,200,{users:Array.from(_u.values()).map(u=>({...u,passwordHash:undefined}))});}
if(req.method==='GET'&&a==='admin_logs'){const a2=rA(req);if(!a2)return sj(res,403,{error:'Admin.'});return sj(res,200,{logs:_a.slice(0,100)});}
if(req.method==='POST'&&a==='admin_reset_password'){const a2=rA(req);if(!a2||!vC(req,a2.session))return sj(res,403,{error:'Admin+CSRF.'});const u=san(body.username).toLowerCase();const nc=san(body.new_code);if(!isCode(nc))return sj(res,400,{error:'6 digits.'});const user=_u.get(u);if(!user)return sj(res,400,{error:'Not found.'});user.passwordHash=hashP(nc);user.forcePasswordChange=true;return sj(res,200,{success:true});}
return sj(res,404,{error:'Unknown.'});};
