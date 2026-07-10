const crypto=require('crypto');const ITER=100000,KEY=32;
function hash(s){const salt=crypto.randomBytes(16).toString('hex');const d=crypto.pbkdf2Sync(String(s),salt,ITER,KEY,'sha256');return'pbkdf2$'+ITER+'$'+salt+'$'+d.toString('hex');}
function verify(p,s){try{if(!s)return false;const ps=s.split('$');if(ps.length!==4||ps[0]!=='pbkdf2')return false;const d=crypto.pbkdf2Sync(String(p),ps[2],parseInt(ps[1]),KEY,'sha256');return crypto.timingSafeEqual(Buffer.from(ps[3],'hex'),d);}catch(e){return false;}}
function san(s){return typeof s==='string'?s.trim().replace(/[<>'"]/g,''):'';}
function isCode(c){return/^\d{6}$/.test(String(c));}
const _s={rl:new Map(),ss:new Map(),set:null,audit:[]};
const RL={user_code:{m:5,l:15},admin_code:{m:5,l:30},security_ans:{m:5,l:15}};
const DEF={user_code_hash:'pbkdf2$100000$bc2325a68f3b4f402fa2f302ecd2d1f7$76b87b0e55befdffdfaf6c61839a20a0911e67a1781c84e81d7345fe33250707',admin_code_hash:'pbkdf2$100000$b08016c2078313a6d1d5a244c7cadec6$1a2f6bea3d8310824bae9172400541bde2b614bd8bc5904afa7ff0a710fca42d',security_question:"What's your favourite food?",security_answer_hash:'pbkdf2$100000$cbbc7f02071409809a90104d4d4297cf$b6399075367fa106192fa32f290092df8c242b360d6ce1a8d57b98fa95973505',session_expiry_minutes:60,protected_sections:['materia','repertory','therapeutics','irap','roh','synthesis','favorites','notes','history','settings'],protection_enabled:true,version:1};
function getSet(){if(!_s.set)_s.set={...DEF};return _s.set;}
function getIP(r){return(r.headers['x-forwarded-for']||'').split(',')[0].trim()||(r.headers['x-real-ip']||'')||'unknown';}
function checkRL(k,t){const c=RL[t];if(!c)return{allowed:true};const n=Date.now();const sk=k+'_'+t;let e=_s.rl.get(sk);if(e&&e.lockedUntil&&n<e.lockedUntil)return{allowed:false,locked:true,rm:Math.ceil((e.lockedUntil-n)/60000)};if(e&&e.lockedUntil&&n>=e.lockedUntil){e=null;_s.rl.delete(sk);}if(!e||(n-e.firstAttempt)>c.l*60000)e={count:0,firstAttempt:n,lockedUntil:null};e.count++;_s.rl.set(sk,e);if(e.count>=c.m){e.lockedUntil=n+c.l*60000;_s.rl.set(sk,e);return{allowed:false,locked:true,rm:c.l};}return{allowed:true,ar:c.m-e.count};}
function resetRL(k,t){_s.rl.delete(k+'_'+t);}
function genT(){return crypto.randomBytes(32).toString('hex');}
function genC(){return crypto.randomBytes(16).toString('hex');}
function createS(t,ip,csrf,exp){const tk=genT();_s.ss.set(tk,{type:t,ip,csrf,createdAt:Date.now(),expiresAt:Date.now()+exp*60000});return tk;}
function getS(tk){if(!tk)return null;const s=_s.ss.get(tk);if(!s)return null;if(Date.now()>s.expiresAt){_s.ss.delete(tk);return null;}return s;}
function destroyS(tk){if(tk)_s.ss.delete(tk);}
function logA(e){_s.audit.unshift({ts:new Date().toISOString(),...e});if(_s.audit.length>100)_s.audit.pop();}
const CK='ph_sec_session';
function sj(r,c,d){r.setHeader('Content-Type','application/json');r.status(c).json(d);}
function sc(r,t,m){r.setHeader('Set-Cookie',CK+'='+t+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+m*60);}
function cc(r){r.setHeader('Set-Cookie',CK+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');}
function gsr(r){const c=r.headers.cookie||'';const m=c.match(new RegExp(CK+'=([^;]+)'));return m?getS(m[1]):null;}
function vCSRF(r,s){const c=r.headers['x-csrf-token']||(r.body&&r.body._csrf)||'';return s&&s.csrf===c;}
module.exports=async(req,res)=>{
res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,X-CSRF-Token');res.setHeader('X-Content-Type-Options','nosniff');
if(req.method==='OPTIONS')return res.status(204).end();
const a=req.query.action||'';const ip=getIP(req);let body={};try{body=(req.body&&typeof req.body==='object')?req.body:(typeof req.body==='string'?JSON.parse(req.body):{});}catch(e){body={};}
if(req.method==='GET'&&a==='status'){const s=getSet();return sj(res,200,{installed:!!(s.user_code_hash&&s.admin_code_hash),protection_enabled:s.protection_enabled,session_active:!!gsr(req),version:s.version});}
if(req.method==='GET'&&a==='csrf'){let s=gsr(req);if(!s){const csrf=genC();const t=createS('anonymous',ip,csrf,60);sc(res,t,60);return sj(res,200,{csrf});}return sj(res,200,{csrf:s.csrf});}
if(req.method==='GET'&&a==='check'){const s=gsr(req);if(!s)return sj(res,200,{authenticated:false});return sj(res,200,{authenticated:true,type:s.type,csrf:s.csrf});}
if(req.method==='GET'&&a==='question'){return sj(res,200,{question:getSet().security_question});}
if(req.method==='GET'&&a==='config'){const s=getSet();return sj(res,200,{installed:!!(s.user_code_hash&&s.admin_code_hash),protection_enabled:s.protection_enabled,protected_sections:s.protected_sections||[],session_expiry_minutes:s.session_expiry_minutes||60});}
if(req.method==='POST'&&a==='verify_user'){const s=getSet();const rl=checkRL(ip,'user_code');if(!rl.allowed){logA({event:'user_locked',ip});return sj(res,429,{error:'Locked '+rl.rm+'min.'});}const code=san(body.code);if(!isCode(code))return sj(res,400,{error:'6 digits.'});if(verify(code,s.user_code_hash)){resetRL(ip,'user_code');const csrf=genC();const exp=s.session_expiry_minutes||60;const t=createS('user',ip,csrf,exp);sc(res,t,exp);logA({event:'user_login',ip});return sj(res,200,{success:true,csrf,type:'user'});}else{logA({event:'user_fail',ip});return sj(res,401,{error:'Invalid.',ar:rl.ar});}}
if(req.method==='POST'&&a==='verify_admin'){const s=getSet();const rl=checkRL(ip,'admin_code');if(!rl.allowed){return sj(res,429,{error:'Admin locked '+rl.rm+'min.'});}const code=san(body.code);if(!isCode(code))return sj(res,400,{error:'6 digits.'});if(verify(code,s.admin_code_hash)){resetRL(ip,'admin_code');const csrf=genC();const exp=s.session_expiry_minutes||60;const t=createS('admin',ip,csrf,exp);sc(res,t,exp);return sj(res,200,{success:true,csrf,type:'admin'});}else{return sj(res,401,{error:'Invalid.',ar:rl.ar});}}
if(req.method==='POST'&&a==='verify_answer'){const s=getSet();const rl=checkRL(ip,'security_ans');if(!rl.allowed){return sj(res,429,{error:'Reset locked '+rl.rm+'min.'});}const ans=san(body.answer).toLowerCase();if(!ans)return sj(res,400,{error:'Answer required.'});if(verify(ans,s.security_answer_hash)){resetRL(ip,'security_ans');const csrf=genC();const t=createS('reset',ip,csrf,10);sc(res,t,10);return sj(res,200,{success:true,csrf,type:'reset'});}else{return sj(res,401,{error:'Incorrect.',ar:rl.ar});}}
if(req.method==='POST'&&a==='reset_code'){const s=gsr(req);if(!s||s.type!=='reset')return sj(res,403,{error:'Reset required.'});if(!vCSRF(req,s))return sj(res,403,{error:'CSRF.'});const nc=san(body.new_code);if(!isCode(nc))return sj(res,400,{error:'6 digits.'});getSet().user_code_hash=hash(nc);const c=req.headers.cookie||'';const m=c.match(new RegExp(CK+'=([^;]+)'));destroyS(m?m[1]:null);cc(res);return sj(res,200,{success:true});}
if(req.method==='POST'&&a==='logout'){const c=req.headers.cookie||'';const m=c.match(new RegExp(CK+'=([^;]+)'));if(m)destroyS(m[1]);cc(res);return sj(res,200,{success:true});}
function rA(req){const s=gsr(req);return(s&&s.type==='admin')?s:null;}
if(req.method==='GET'&&a==='admin_status'){const s=rA(req);if(!s)return sj(res,403,{error:'Admin.'});const st=getSet();return sj(res,200,{protection_enabled:st.protection_enabled,session_expiry_minutes:st.session_expiry_minutes,protected_sections:st.protected_sections,security_question:st.security_question,has_user_code:!!st.user_code_hash,has_admin_code:!!st.admin_code_hash});}
if(req.method==='GET'&&a==='admin_logs'){const s=rA(req);if(!s)return sj(res,403,{error:'Admin.'});return sj(res,200,{logs:_s.audit.slice(0,50)});}
if(req.method==='POST'&&a==='admin_change_user_code'){const s=rA(req);if(!s||!vCSRF(req,s))return sj(res,403,{error:'Admin+CSRF.'});const c=san(body.new_code);if(!isCode(c))return sj(res,400,{error:'6 digits.'});getSet().user_code_hash=hash(c);return sj(res,200,{success:true});}
if(req.method==='POST'&&a==='admin_change_admin_code'){const s=rA(req);if(!s||!vCSRF(req,s))return sj(res,403,{error:'Admin+CSRF.'});const c=san(body.new_code);if(!isCode(c))return sj(res,400,{error:'6 digits.'});getSet().admin_code_hash=hash(c);return sj(res,200,{success:true});}
if(req.method==='POST'&&a==='admin_change_question'){const s=rA(req);if(!s||!vCSRF(req,s))return sj(res,403,{error:'Admin+CSRF.'});const q=san(body.question);const a2=san(body.answer).toLowerCase();if(!q||!a2)return sj(res,400,{error:'Q&A required.'});getSet().security_question=q;getSet().security_answer_hash=hash(a2);return sj(res,200,{success:true});}
if(req.method==='POST'&&a==='admin_toggle_protection'){const s=rA(req);if(!s||!vCSRF(req,s))return sj(res,403,{error:'Admin+CSRF.'});getSet().protection_enabled=!!body.enabled;return sj(res,200,{success:true});}
if(req.method==='POST'&&a==='admin_unlock'){const s=rA(req);if(!s||!vCSRF(req,s))return sj(res,403,{error:'Admin+CSRF.'});const t=san(body.ip)||'';if(t){resetRL(t,'user_code');resetRL(t,'admin_code');resetRL(t,'security_ans');}return sj(res,200,{success:true});}
return sj(res,404,{error:'Unknown.'});};
