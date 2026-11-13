"""Build a source-only, checksummed Mikoshi release. Never includes working databases."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import tarfile

ROOT = Path(__file__).resolve().parents[2]
WEB = 'frontend/mikoshi-web'
COMPONENT = 'Components/kol-selection'
WEB_CONFIG = {'package.json','package-lock.json','next.config.ts','next-env.d.ts',
              'tsconfig.json','postcss.config.mjs','THIRD_PARTY_NOTICES.md'}
OPS = {'auth.py','server.py','bundle.py','install.py','DEPLOY.md','AUTH.md'}
DIST_ROOT = {'index.html','app.js','style.css','planner.js','planner-core.js','planner.css',
             'planner-defaults.json','factory.js','factory.css','graph-core.js','performance.js',
             'avatars.json','research.json','recent-works.json','data.json','persistence.js'}
ASSET = re.compile(r'assets/(?:works/up-[\w-]+\.json|avatars/[\w-]+\.(?:jpg|jpeg|png|webp|avif|gif))',re.ASCII)

def allowed(name):
    p=PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or '\\' in name: return False
    if any(part.startswith('.') and part != '.well-known' for part in p.parts): return False
    if p.suffix.lower() in {'.sqlite','.db','.key','.pem','.pfx','.xlsx','.docx','.pdf','.log'}: return False
    if name.startswith(WEB+'/'):
        suffix=name[len(WEB)+1:]
        return suffix in WEB_CONFIG or suffix.startswith(('src/','public/'))
    if name.startswith(COMPONENT+'/upstream/dist/'):
        suffix=name[len(COMPONENT+'/upstream/dist/'):]
        return suffix in DIST_ROOT or bool(ASSET.fullmatch(suffix))
    if name in {COMPONENT+'/upstream/local_server.py',COMPONENT+'/upstream/cloud/persistence.js',
                COMPONENT+'/upstream/team-preview/read.js',COMPONENT+'/upstream/team-preview/read.css',
                COMPONENT+'/integration/bridge.js',COMPONENT+'/integration/embedded.css'}: return True
    return name.startswith('ops/mikoshi-cloud/') and name.removeprefix('ops/mikoshi-cloud/') in OPS

def package(output, root=ROOT):
    output=output.resolve()
    files={}
    # Enumerate only the owned application/component trees, never the whole repository.
    candidates=[]
    for folder in [root/WEB/'src',root/WEB/'public',root/COMPONENT/'upstream/dist']:
        candidates.extend(p for p in folder.rglob('*') if p.is_file())
    candidates.extend(root/WEB/name for name in WEB_CONFIG)
    candidates.extend(root/'ops/mikoshi-cloud'/name for name in OPS)
    candidates.extend(root/name for name in [COMPONENT+'/upstream/local_server.py',
        COMPONENT+'/upstream/cloud/persistence.js',COMPONENT+'/upstream/team-preview/read.js',
        COMPONENT+'/upstream/team-preview/read.css',COMPONENT+'/integration/bridge.js',COMPONENT+'/integration/embedded.css'])
    for file in sorted(set(candidates)):
        if not file.is_file():
            if file.name in {'AUTH.md','next-env.d.ts'}: continue
            raise ValueError('Missing release input: '+str(file.relative_to(root)))
        name=file.relative_to(root).as_posix()
        if file.is_symlink() or not file.resolve().is_relative_to(root.resolve()): raise ValueError('Symlink/outside input: '+name)
        if not allowed(name): raise ValueError('Unapproved release input: '+name)
        files[name]=file
    required=[WEB+'/public/legacy/kol.html',WEB+'/public/legacy/thirdparty.html',WEB+'/src/app/(app)/kol/studio/page.tsx']
    for name in required:
        if name not in files: raise ValueError('Generate and verify public assets before bundling: '+name)
    output.parent.mkdir(parents=True,exist_ok=True)
    if output.exists(): raise ValueError('Output already exists; choose a new release filename.')
    hashes={}
    with tarfile.open(output,'x:gz',compresslevel=3) as tar:
        for name,file in files.items():
            data=file.read_bytes()
            hashes[name]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
            item=tarfile.TarInfo('mikoshi-release/'+name);item.size=len(data);item.mode=0o640;item.mtime=0
            tar.addfile(item,io.BytesIO(data))
        manifest=json.dumps({'format':1,'product':'mikoshi','mode':'source','files':hashes},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
        item=tarfile.TarInfo('mikoshi-release/manifest.json');item.size=len(manifest);item.mode=0o640;item.mtime=0
        tar.addfile(item,io.BytesIO(manifest))
    digest=hashlib.sha256(output.read_bytes()).hexdigest()
    print(json.dumps({'release':hashlib.sha256(manifest).hexdigest()[:20],'files':len(files),'archive':str(output),'bytes':output.stat().st_size,'sha256':digest},ensure_ascii=False))

if __name__=='__main__':
    cli=argparse.ArgumentParser();cli.add_argument('--output',required=True,type=Path)
    args=cli.parse_args();package(args.output)
