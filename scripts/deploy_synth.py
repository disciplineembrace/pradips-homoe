import hashlib, json, os, urllib.request, urllib.error, time
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN')
DEPLOY_DIR = '/home/z/my-project/vercel-deploy'
BASE_URL = 'https://api.vercel.com'
TEAM = 'campus-nova-s-projects'
def get_files(d):
    r=[]
    for root,dirs,files in os.walk(d):
        dirs[:]=[x for x in dirs if not x.startswith('.') and x!='node_modules']
        for f in files:
            if f.startswith('.'):continue
            p=os.path.join(root,f)
            r.append((os.path.relpath(p,d).replace(os.sep,'/'),p))
    return r
def api(m,p,data=None,raw=None,hdr=None):
    url=f'{BASE_URL}{p}'
    if '?' in url:url+=f'&teamSlug={TEAM}'
    else:url+=f'?teamSlug={TEAM}'
    headers={'Authorization':f'Bearer {VERCEL_TOKEN}'}
    if hdr:headers.update(hdr)
    if raw:d2=raw
    elif data:d2=json.dumps(data).encode();headers['Content-Type']='application/json'
    else:d2=None
    req=urllib.request.Request(url,data=d2,headers=headers,method=m)
    try:
        with urllib.request.urlopen(req,timeout=180) as r:return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:print(f'HTTP {e.code}:{e.read().decode()[:200]}');return None
    except Exception as e:print(f'Err:{e}');return None
def main():
    files=get_files(DEPLOY_DIR)
    print(f'{len(files)} files')
    up=[]
    for rel,p in files:
        with open(p,'rb') as f:c=f.read()
        sha=hashlib.sha1(c).hexdigest()
        print(f'  {rel}...',end=' ',flush=True)
        r=api('POST',f'/v2/files?teamSlug={TEAM}',raw=c,hdr={'Content-Type':'application/octet-stream','x-vercel-digest':sha,'Content-Length':str(len(c))})
        if r is None:print('FAIL');return
        up.append({'file':rel,'sha':sha,'size':len(c)})
        print('✓')
    d={'name':'pradips-homoe','target':'production','files':[{'file':f['file'],'sha':f['sha'],'size':f['size']} for f in up],'projectSettings':{'framework':None,'buildCommand':None,'outputDirectory':None,'installCommand':None}}
    r=api('POST',f'/v13/deployments?teamSlug={TEAM}',data=d)
    if not r:print('FAIL');return
    print(f'URL: https://{r["url"]}')
    for i in range(60):
        time.sleep(10)
        r2=api('GET',f'/v13/deployments/{r["id"]}?teamSlug={TEAM}')
        if r2 and r2.get('readyState')=='READY':print(f'✓ READY! https://{r["url"]}');return
        if r2 and r2.get('readyState')=='ERROR':print('✗ FAIL');return
        print(f'  Check {i+1}: {r2.get("readyState") if r2 else "?"}')
if __name__=='__main__':main()
