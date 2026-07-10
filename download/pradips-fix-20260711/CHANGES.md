# Pradip's Homoe — Critical Fix (2026-07-11)

## The bug

Site was stuck on "Loading library..." forever.

**Root cause:** `preloadAssets()` was called at line 2551 of `index.html`
but the function was never defined (deleted in a previous refactor).

This threw `ReferenceError: preloadAssets is not defined`, which aborted
the entire main `<script>` block — so `loadState()`, `renderHome()`, and
`loadData()` at the bottom of the same block never ran, leaving the
loader overlay stuck.

## What changed

### 1. `index.html` — replaced broken call with safe no-op

```diff
- // 13. INITIALIZATION — start preloading immediately
- preloadAssets();
+ // 13. INITIALIZATION — start preloading immediately
+ // Safe no-op stub (previously preloadAssets() was undefined and threw
+ // ReferenceError, which aborted the whole init block and left the
+ // loader stuck forever).
+ try { (window.preloadAssets || function(){}); } catch(e){ console.warn('preload stub failed', e); }
```

### 2. `index.html` — wrapped init calls in try/catch (defense in depth)

```diff
- /* ============ INIT ============ */
- loadState();
- renderHome();
- loadData();
+ /* ============ INIT ============ */
+ try { loadState(); } catch(e){ console.error('loadState failed:', e); }
+ try { renderHome(); } catch(e){ console.error('renderHome failed:', e); }
+ try { loadData(); } catch(e){
+   console.error('loadData failed:', e);
+   var le = document.getElementById('dataLoader');
+   if (le) le.innerHTML = '<div style="color:#6E2A3A;padding:20px;text-align:center;"><h3>Loading Error</h3><p style="margin:8px 0;font-size:0.85rem;">' + escapeHTML(String(e && e.message || e)) + '</p><button onclick="location.reload()" style="background:#1d3a2b;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;margin-top:12px;">Retry</button></div>';
+ }
```

### 3. `index.html` — bumped cache-bust versions

- `remedies.json?v=20260710cc` → `remedies.json?v=20260711a`
- `rubrics.json?v=20260710cc` → `rubrics.json?v=20260711a`
- Module scripts `?v=8` → `?v=9`

### 4. NEW `manifest.json` — silenced 404s

Added a minimal PWA manifest so the browser stops 404-ing on manifest.json.

## How to deploy

### Option A — Run the deploy script (easiest)

```bash
export VERCEL_TOKEN='vcp_YOUR_TOKEN_HERE'
bash /home/z/my-project/download/pradips-fix-20260711/deploy.sh
```

### Option B — Manual Vercel dashboard upload

1. Go to https://vercel.com/dashboard
2. Open the `pradips-homoe` project
3. Click "Deployments" → "Redeploy" won't help (no git remote)
4. Better: Drag the `vercel-deploy-fixed.zip` into a NEW deployment at
   https://vercel.com/new
   - BUT this creates a new project. To update the existing project,
   prefer Option A or C.

### Option C — Vercel CLI

```bash
npm i -g vercel
cd /home/z/my-project/vercel-deploy
vercel --prod --yes --token vcp_YOUR_TOKEN_HERE
```

## After deploying

Tell users to:
1. Open the site in a private/incognito window first (to bypass any old cache)
2. If it loads, great — they can use their normal browser too
3. If still stuck in normal browser: do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. As a last resort: clear site data via DevTools → Application → Storage → Clear site data

## Verification (already done)

Tested with headless Chromium (Puppeteer) locally:
- ✅ Page loads in ~3.5s
- ✅ Loader overlay auto-hides
- ✅ REMEDIES array: 3,471 entries loaded
- ✅ RUBRICS array: 79,706 entries loaded
- ✅ Home view renders
- ✅ No JS errors in console

