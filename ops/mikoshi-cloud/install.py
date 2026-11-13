"""Install Mikoshi alongside the existing team services; Linux/Python standard library.

No business-data import, credential output, release deletion, or backup rotation.
"""
import sys
# Verification imports the release's local allowlist; never create an unmanifested
# __pycache__ in the package being verified, even without a caller-supplied -B.
sys.dont_write_bytecode = True

import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import socket
import sqlite3
import ssl
import subprocess
import tarfile
import tempfile
import time
import urllib.request

HOST='8.218.158.143'
ORIGIN='https://'+HOST
HOME=Path('/opt/mikoshi')
CURRENT=HOME/'current'
RELEASES=HOME/'releases'
BACKUPS=Path('/var/backups/mikoshi')
DB=Path('/var/lib/kol-workbench/workspace.sqlite')
AUTH_DB=Path('/var/lib/mikoshi-auth/auth.sqlite')
BOOTSTRAP=Path('/var/lib/mikoshi-auth/bootstrap-invite.txt')
SITE_CONF=Path('/etc/nginx/sites-available/mindmap')
SNIPPET=Path('/etc/nginx/snippets/mikoshi.conf')
UNITS=Path('/etc/systemd/system')
NODE_VERSION='v22.23.4'
NODE_SHA256='1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce'
NODE_ARCHIVE='node-'+NODE_VERSION+'-linux-x64'
NODE_URL='https://nodejs.org/dist/'+NODE_VERSION+'/'+NODE_ARCHIVE+'.tar.xz'
NODE=HOME/'node/bin/node'
INCLUDE='include /etc/nginx/snippets/mikoshi.conf;'
SERVICES=('mikoshi-gateway.service','mikoshi-web.service','mikoshi-backup.timer')
MANAGED=(SITE_CONF,SNIPPET,*(UNITS/name for name in ('mikoshi-gateway.service','mikoshi-web.service','mikoshi-backup.service','mikoshi-backup.timer')))

PROXY="""    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_read_timeout 60s;
    proxy_connect_timeout 5s;
"""
NGINX="""# Managed by SBS-0019. Existing / and /kol/ locations remain unchanged.
location = /_mikoshi_auth {
    internal;
    proxy_pass http://127.0.0.1:8878/mikoshi-api/auth/check;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;
"""+PROXY+"""}
location = /mikoshi { return 308 /mikoshi/$is_args$args; }
location = /mikoshi/login {
    proxy_pass http://127.0.0.1:3118;
"""+PROXY+"""}
location ^~ /mikoshi/_next/static/ {
    proxy_pass http://127.0.0.1:3118;
"""+PROXY+"""}
location ^~ /mikoshi/brand/ {
    proxy_pass http://127.0.0.1:3118;
"""+PROXY+"""}
location ^~ /mikoshi/ {
    auth_request /_mikoshi_auth;
    error_page 401 = @mikoshi_login;
    proxy_pass http://127.0.0.1:3118;
"""+PROXY+"""}
location @mikoshi_login { return 302 /mikoshi/login; }
location ^~ /mikoshi-api/ {
    client_max_body_size 18m;
    proxy_pass http://127.0.0.1:8878;
"""+PROXY+"""}
location = /kol-studio { return 308 /kol-studio/$is_args$args; }
location ^~ /kol-studio/ {
    client_max_body_size 18m;
    proxy_pass http://127.0.0.1:8878;
"""+PROXY+"""}
"""
GATEWAY="""[Unit]
Description=Mikoshi authenticated KOL and account gateway
After=network.target kol-workbench.service
Requires=kol-workbench.service
[Service]
DynamicUser=yes
User=kol-workbench
SupplementaryGroups=mikoshi-data
StateDirectory=kol-workbench mikoshi-auth
StateDirectoryMode=0700
WorkingDirectory=/opt/mikoshi/current
Environment=PYTHONDONTWRITEBYTECODE=1
ExecStart=/usr/bin/python3 /opt/mikoshi/current/ops/mikoshi-cloud/server.py --port 8878 --database /var/lib/kol-workbench/workspace.sqlite --auth-database /var/lib/mikoshi-auth/auth.sqlite --origin https://8.218.158.143
Restart=on-failure
RestartSec=3
UMask=0077
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
NoNewPrivileges=yes
RestrictAddressFamilies=AF_INET AF_UNIX
[Install]
WantedBy=multi-user.target
"""
TIMER="""[Unit]
Description=Daily consistent backups of Mikoshi accounts and shared KOL data
[Timer]
OnCalendar=*-*-* 04:50:00
Persistent=yes
[Install]
WantedBy=timers.target
"""
DAILY="""[Unit]
Description=Back up Mikoshi accounts and shared KOL workspace without deleting old snapshots
[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /opt/mikoshi/current/ops/mikoshi-cloud/install.py --backup-only
UMask=0077
ProtectSystem=strict
ReadWritePaths=/var/backups/mikoshi /run/lock
PrivateTmp=yes
"""

def stamp(): return datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
def digest(data): return hashlib.sha256(data).hexdigest()
def run(*args,**kwargs): return subprocess.run(list(map(str,args)),check=True,**kwargs)
def state(command,name): return subprocess.run(['systemctl',command,'--quiet',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0

def fixed(path,data,mode=0o644):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(dir=path.parent,prefix='.mikoshi-')
    try:
        with os.fdopen(fd,'wb') as stream: stream.write(data);stream.flush();os.fsync(stream.fileno())
        os.chmod(name,mode);os.replace(name,path)
    finally:
        Path(name).unlink(missing_ok=True)  # Only this invocation's uncommitted temporary file.

def verify(root):
    root=root.resolve();raw=(root/'manifest.json').read_bytes();meta=json.loads(raw)
    if meta.get('format')!=1 or meta.get('product')!='mikoshi' or meta.get('mode')!='source' or not isinstance(meta.get('files'),dict):
        raise ValueError('Unsupported release manifest.')
    # The release carries the same allowlist used by the local packager.
    from bundle import allowed
    entries=list(root.rglob('*'))
    if any(p.is_symlink() or not (p.is_file() or p.is_dir()) for p in entries): raise ValueError('Release contains links or special files.')
    actual={p.relative_to(root).as_posix() for p in entries if p.is_file()}
    if actual != set(meta['files'])|{'manifest.json'}: raise ValueError('Release file inventory differs from manifest.')
    for name,record in meta['files'].items():
        p=root/name
        if not allowed(name) or p.is_symlink() or not p.resolve().is_relative_to(root) or any((root/Path(*PurePosixPath(name).parts[:i])).is_symlink() for i in range(1,len(PurePosixPath(name).parts))):
            raise ValueError('Unsafe release path: '+name)
        data=p.read_bytes()
        if not isinstance(record,dict) or len(data)!=record.get('bytes') or digest(data)!=record.get('sha256'): raise ValueError('Release checksum mismatch: '+name)
    return meta,digest(raw)[:20]

def snapshot(source,target):
    if not source.is_file(): raise ValueError('Required database does not exist: '+str(source))
    if target.exists(): raise ValueError('Refusing to overwrite a snapshot.')
    target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    with closing(sqlite3.connect(source.resolve().as_uri()+'?mode=ro',uri=True,timeout=20)) as src, closing(sqlite3.connect(target)) as dst:
        src.backup(dst)
        if dst.execute('PRAGMA quick_check').fetchone()[0]!='ok': raise ValueError('Database backup integrity check failed.')
    target.chmod(0o600)
    return {'bytes':target.stat().st_size,'sha256':digest(target.read_bytes())}

def database_backups(folder):
    folder.mkdir(parents=True,exist_ok=False,mode=0o700)
    result={'workspace.sqlite':snapshot(DB,folder/'workspace.sqlite')}
    if AUTH_DB.is_file(): result['auth.sqlite']=snapshot(AUTH_DB,folder/'auth.sqlite')
    fixed(folder/'database-checksums.json',json.dumps(result,indent=2).encode(),0o600)

def runtime_directories():
    """Public code ancestors must remain traversable even under root umask 077."""
    for folder in (HOME,RELEASES):
        if folder.is_symlink(): raise ValueError('Runtime directory must not be a symlink: '+str(folder))
        folder.mkdir(parents=True,exist_ok=True,mode=0o755)
        folder.chmod(0o755)

def normalize_runtime_tree(root,owner=None):
    """Readable code tree, preserving executable files; never chmod link targets."""
    for path in [root,*root.rglob('*')]:
        if not path.is_symlink():
            mode=path.stat().st_mode
            path.chmod(0o755 if path.is_dir() or mode&0o111 else 0o644)
        if owner is not None: os.chown(path,*owner,follow_symlinks=False)

def node_install():
    runtime_directories()
    if NODE.exists():
        if run(NODE,'--version',capture_output=True,text=True).stdout.strip()!=NODE_VERSION: raise ValueError('Existing isolated Node has another version; no overwrite performed.')
        normalize_runtime_tree(HOME/'node')
        return
    target=HOME/'node'
    if target.exists(): raise ValueError('Node destination already exists but is incomplete.')
    (HOME/'downloads').mkdir(parents=True,exist_ok=True,mode=0o700)
    archive=HOME/'downloads'/(NODE_ARCHIVE+'.tar.xz')
    if not archive.exists():
        with urllib.request.urlopen(NODE_URL,timeout=60) as source, open(archive,'xb') as out: shutil.copyfileobj(source,out)
    if digest(archive.read_bytes())!=NODE_SHA256: raise ValueError('Official Node archive SHA256 mismatch; retained for inspection.')
    with tempfile.TemporaryDirectory(dir=HOME,prefix='.node-install-') as temp:
        with tarfile.open(archive,'r:xz') as tar:
            for member in tar.getmembers():
                path=PurePosixPath(member.name)
                if path.is_absolute() or '..' in path.parts or path.parts[0]!=NODE_ARCHIVE: raise ValueError('Invalid Node archive path.')
            tar.extractall(temp,filter='data')
        os.rename(Path(temp)/NODE_ARCHIVE,target)
    normalize_runtime_tree(target)
    if run(NODE,'--version',capture_output=True,text=True).stdout.strip()!=NODE_VERSION: raise ValueError('Node executable version mismatch.')

def nginx_route(text):
    blocks=list(re.finditer(r'(?ms)^server\s*\{\s*(.*?)^\}',text))
    matching=[b for b in blocks if re.search(r'(?m)^\s*listen\s+443\s+ssl[^\n;]*;',b[1]) and re.search(r'(?m)^\s*server_name\s+'+re.escape(HOST)+r'\s*;',b[1])]
    if len(matching)!=1: raise ValueError('Expected exactly one registered HTTPS virtual host.')
    block=matching[0]
    if INCLUDE in text:
        if text.count(INCLUDE)!=1 or INCLUDE not in block[1]: raise ValueError('Unexpected Mikoshi include placement.')
        return text
    if re.search(r'(?m)^\s*location\s+[^\n{]*(?:/mikoshi|/kol-studio|/_mikoshi_auth)',text): raise ValueError('A conflicting route already exists; stop for review.')
    return text[:block.end()-1]+'    '+INCLUDE+'\n'+text[block.end()-1:]

def data_group():
    """Stable resource ownership, independent of the legacy service's dynamic GID."""
    import grp
    try: return grp.getgrnam('mikoshi-data').gr_gid
    except KeyError:
        run('groupadd','--system','mikoshi-data')
        return grp.getgrnam('mikoshi-data').gr_gid

def account():
    import pwd,grp
    data_group()
    try: user=pwd.getpwnam('mikoshi-web')
    except KeyError:
        run('useradd','--system','--user-group','--home-dir','/var/lib/mikoshi-web','--no-create-home','--shell','/usr/sbin/nologin','mikoshi-web')
        user=pwd.getpwnam('mikoshi-web')
    if grp.getgrnam('mikoshi-web').gr_gid!=user.pw_gid: raise ValueError('Existing Mikoshi service account has an unexpected primary group.')
    for folder in (Path('/var/lib/mikoshi-web'),Path('/var/cache/mikoshi-npm'),Path('/var/cache/mikoshi-web')):
        folder.mkdir(parents=True,exist_ok=True,mode=0o750);folder.chmod(0o750);os.chown(folder,user.pw_uid,user.pw_gid)
    return user

def build_release(root,release_id,log):
    user=account();node_install()
    # Verify the same identity used by npm can traverse the complete Node path.
    version=run('runuser','-u','mikoshi-web','--',NODE,'--version',capture_output=True,text=True).stdout.strip()
    if version!=NODE_VERSION: raise ValueError('Node is unavailable to the build service account.')
    release=RELEASES/release_id
    if release.exists():
        receipt=json.loads((release/'build-receipt.json').read_bytes())
        entry=release/receipt['entry']
        if receipt.get('release')!=release_id or not entry.is_file(): raise ValueError('Existing release is incomplete; retained without overwriting.')
        return release,receipt['entry']
    stage=RELEASES/('.build-'+release_id+'-'+stamp())
    shutil.copytree(root,stage)
    for p in [stage,*stage.rglob('*')]: p.chmod(0o755 if p.is_dir() else 0o644)
    web=stage/'frontend/mikoshi-web'
    for p in [web,*web.rglob('*')]: os.chown(p,user.pw_uid,user.pw_gid)
    environment={'PATH':str(NODE.parent)+':/usr/bin:/bin','HOME':'/var/lib/mikoshi-web','npm_config_cache':'/var/cache/mikoshi-npm',
                 'NEXT_TELEMETRY_DISABLED':'1','NEXT_PUBLIC_MIKOSHI_AUTH_MODE':'production','NEXT_PUBLIC_MIKOSHI_BASE_PATH':'/mikoshi',
                 'MIKOSHI_GATEWAY_ORIGIN':'http://127.0.0.1:8878','NODE_OPTIONS':'--max-old-space-size=768'}
    with open(log,'ab') as output:
        log.chmod(0o600)
        common=['runuser','-u','mikoshi-web','--','env',*[k+'='+v for k,v in environment.items()]]
        run(*common,NODE.parent/'npm','ci','--no-audit','--no-fund',cwd=web,stdout=output,stderr=subprocess.STDOUT,umask=0o022)
        # Call Next directly: public/legacy is already generated, and References is intentionally absent.
        run(*common,NODE,'node_modules/next/dist/bin/next','build',cwd=web,stdout=output,stderr=subprocess.STDOUT,umask=0o022)
    candidates=[web/'.next/standalone/server.js',web/'.next/standalone/frontend/mikoshi-web/server.js']
    entry=next((p for p in candidates if p.is_file()),None)
    if entry is None: raise ValueError('Next standalone entry was not generated; inspect private build log.')
    runtime=entry.parent
    shutil.copytree(web/'public',runtime/'public',dirs_exist_ok=True)
    shutil.copytree(web/'.next/static',runtime/'.next/static',dirs_exist_ok=True)
    cache=Path('/var/cache/mikoshi-web')/release_id;cache.mkdir(exist_ok=True,mode=0o750);cache.chmod(0o750);os.chown(cache,user.pw_uid,user.pw_gid)
    runtime_cache=runtime/'.next/cache'
    if runtime_cache.exists(): os.rename(runtime_cache,runtime/'.next/cache-from-build')
    runtime_cache.symlink_to(cache,target_is_directory=True)
    # Build runs unprivileged; published code then becomes immutable to the service identity.
    normalize_runtime_tree(web,owner=(0,0))
    # DynamicUser's primary GID can change after reboot. Component ownership uses
    # a stable supplementary system group, without changing the legacy service.
    component_gid=data_group()
    component=stage/'Components/kol-selection'
    for p in [component,*component.rglob('*')]: os.chown(p,0,component_gid);p.chmod(0o750 if p.is_dir() else 0o640)
    relative=entry.relative_to(stage).as_posix()
    fixed(stage/'build-receipt.json',json.dumps({'release':release_id,'node':NODE_VERSION,'entry':relative,'builtAt':stamp(),'authMode':'production','basePath':'/mikoshi'},indent=2).encode())
    os.rename(stage,release)
    return release,relative

def web_unit(entry):
    return f'''[Unit]
Description=Mikoshi Next application
After=network.target mikoshi-gateway.service
[Service]
User=mikoshi-web
Group=mikoshi-web
WorkingDirectory=/opt/mikoshi/current/frontend/mikoshi-web
Environment=NODE_ENV=production
Environment=HOSTNAME=127.0.0.1
Environment=PORT=3118
Environment=NEXT_TELEMETRY_DISABLED=1
Environment=NODE_OPTIONS=--max-old-space-size=384
ExecStart=/opt/mikoshi/node/bin/node /opt/mikoshi/current/{entry}
Restart=on-failure
RestartSec=3
UMask=0027
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/var/cache/mikoshi-web
ProtectHome=yes
NoNewPrivileges=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
[Install]
WantedBy=multi-user.target
'''

def activate(path):
    link=HOME/('.activate-'+stamp());link.symlink_to(path);os.replace(link,CURRENT)

def health(port,path,expected=200):
    for attempt in range(40):
        con=http.client.HTTPConnection('127.0.0.1',port,timeout=3)
        try:
            con.request('GET',path);response=con.getresponse();response.read()
            if response.status==expected: return
        except (OSError,http.client.HTTPException): pass
        finally: con.close()
        time.sleep(.5)
    raise RuntimeError(f'Local health check failed on {port}{path}.')

def wait_public_login(timeout=20):
    """Nginx reload returns before the new workers necessarily serve requests."""
    deadline=time.monotonic()+timeout
    last_status=None
    while True:
        remaining=deadline-time.monotonic()
        if remaining<=0: raise RuntimeError(f'HTTPS login readiness timed out (last status: {last_status}).')
        con=http.client.HTTPSConnection(HOST,context=ssl.create_default_context(),timeout=min(3,remaining))
        con._create_connection=lambda addr,connection_timeout,*args:socket.create_connection(('127.0.0.1',443),connection_timeout)
        try:
            con.request('GET','/mikoshi/login');response=con.getresponse();response.read()
            last_status=response.status
            if last_status==200: return
        except (OSError,http.client.HTTPException):
            last_status='connection unavailable'
        finally: con.close()
        time.sleep(min(.5,max(0,deadline-time.monotonic())))

def public_checks():
    # Wait only for the new login route. Then rerun every security and legacy
    # check strictly; readiness must never turn a wrong 401/403/302 into a PASS.
    wait_public_login()
    checks=[('/mikoshi/login',200),('/mikoshi/dashboard',302),('/mikoshi/kol/studio',302),
            ('/kol-studio/api/state',401),('/kol-studio/avatars.json',401),('/mikoshi-api/auth/session',401),
            ('/_mikoshi_auth',404),('/kol/healthz',200),('/kol/api/state',401),('/api/me',401)]
    for path,expected in checks:
        con=http.client.HTTPSConnection(HOST,context=ssl.create_default_context(),timeout=10)
        con._create_connection=lambda addr,timeout,*args:socket.create_connection(('127.0.0.1',443),timeout)
        try:
            con.request('GET',path);response=con.getresponse();response.read()
            if response.status!=expected: raise RuntimeError(f'HTTPS check failed: {path} status {response.status}, expected {expected}.')
        finally: con.close()

def take_configuration_backup(folder,release_id):
    previous=CURRENT.resolve() if CURRENT.is_symlink() else None
    record={'release':release_id,'previous':str(previous) if previous else None,'createdAt':stamp(),'files':{},'services':{}}
    for index,path in enumerate(MANAGED):
        if path.exists():
            data=path.read_bytes();name=f'config-{index}.bak';fixed(folder/name,data,0o600)
            record['files'][str(path)]={'backup':name,'sha256':digest(data),'mode':path.stat().st_mode&0o777}
        else: record['files'][str(path)]=None
    for service in SERVICES: record['services'][service]={'active':state('is-active',service),'enabled':state('is-enabled',service)}
    fixed(folder/'deployment.json',json.dumps(record,indent=2).encode(),0o600)
    return record

def restore(folder,record,check_current=True):
    if check_current:
        for name,expected in record.get('deployedFiles',{}).items():
            if not Path(name).is_file() or digest(Path(name).read_bytes())!=expected: raise ValueError('Configuration changed since deployment; refusing to overwrite: '+name)
    previous=record.get('previous')
    if previous and (not Path(previous).is_dir() or Path(previous).parent.resolve()!=RELEASES.resolve()):
        raise ValueError('Rollback release is missing or outside registered releases.')
    for path in MANAGED:
        old=record['files'][str(path)]
        if old is not None and digest((folder/old['backup']).read_bytes())!=old['sha256']:
            raise ValueError('Rollback backup checksum mismatch.')
    for service in ('mikoshi-web.service','mikoshi-gateway.service'):
        subprocess.run(['systemctl','stop',service],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    if previous:
        target=Path(previous)
        if not target.is_dir() or target.parent.resolve()!=RELEASES.resolve(): raise ValueError('Rollback release is missing or outside registered releases.')
        activate(target)
    elif CURRENT.is_symlink(): CURRENT.unlink()  # Removes only the newly introduced pointer, never a release.
    for path in MANAGED:
        old=record['files'][str(path)]
        if old is None: path.unlink(missing_ok=True)
        else:
            data=(folder/old['backup']).read_bytes()
            if digest(data)!=old['sha256']: raise ValueError('Rollback backup checksum mismatch.')
            fixed(path,data,old['mode'])
    run('systemctl','daemon-reload')
    for service,old in record['services'].items():
        if old['enabled']: run('systemctl','enable',service)
        else: subprocess.run(['systemctl','disable',service],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if old['active']: run('systemctl','restart',service)
        else: subprocess.run(['systemctl','stop',service],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    run('nginx','-t');run('systemctl','reload','nginx')

def bootstrap():
    # On the host, /var/lib/private is intentionally root-only. A runuser process
    # does not inherit systemd's private/id-mapped StateDirectory namespace.
    # Run the offline operation as root against the already-initialized DB, then
    # use its HOST ownership (possibly nobody with id-mapping), never a guessed UID.
    if AUTH_DB.is_symlink() or BOOTSTRAP.is_symlink(): raise ValueError('Identity files must not be symlinks.')
    database=AUTH_DB.resolve(strict=True)
    private=AUTH_DB.parent.resolve(strict=True)
    if database.parent!=private or BOOTSTRAP.parent.resolve(strict=True)!=private:
        raise ValueError('Bootstrap and identity DB must share the registered private directory.')
    owner=database.stat()
    try:
        with closing(sqlite3.connect(database.as_uri()+'?mode=ro',uri=True)) as con:
            users=con.execute('SELECT count(*) FROM users').fetchone()[0]
            active=con.execute('SELECT count(*) FROM invites WHERE bootstrap=1 AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?',(int(time.time()),)).fetchone()[0]
        if users or active or BOOTSTRAP.exists(): return
        run('/usr/bin/python3','-B',CURRENT/'ops/mikoshi-cloud/auth.py','bootstrap','--database',database,'--output',BOOTSTRAP,stdout=subprocess.DEVNULL,umask=0o077)
    finally:
        # Root's SQLite connection may create sidecars. Restore only these exact
        # identity files; no directory ACL or /var/lib/private mode is relaxed.
        for path in [database,BOOTSTRAP,*(database.with_name(database.name+suffix) for suffix in ('-wal','-shm','-journal'))]:
            try:
                if path.is_symlink(): raise ValueError('Unexpected symlink in private identity state.')
                if path.is_file():
                    os.chown(path,owner.st_uid,owner.st_gid,follow_symlinks=False)
                    path.chmod(0o600)
            except FileNotFoundError:
                pass  # SQLite may have removed a sidecar after committing.

def deploy(root,release_id):
    if platform.system()!='Linux' or platform.machine() not in ('x86_64','amd64'): raise ValueError('This installer targets Linux x86_64 only.')
    if not SITE_CONF.is_file() or not Path('/etc/nginx/sites-enabled/mindmap').exists(): raise ValueError('Registered team virtual host is missing.')
    for service in ('mindmap.service','kol-workbench.service'): run('systemctl','is-active','--quiet',service)
    run('nginx','-t')
    if CURRENT.exists() and not CURRENT.is_symlink(): raise ValueError('Current release pointer is not a symlink.')
    for port,service in ((3118,'mikoshi-web.service'),(8878,'mikoshi-gateway.service')):
        if not state('is-active',service):
            with socket.socket() as probe: probe.bind(('127.0.0.1',port))
    original=SITE_CONF.read_text();proposed=nginx_route(original)
    if shutil.disk_usage('/opt').free<3*1024**3: raise ValueError('At least 3 GiB free space is required for staging and rollback.')
    runtime_directories();BACKUPS.mkdir(parents=True,exist_ok=True,mode=0o700);BACKUPS.chmod(0o700)
    log=BACKUPS/('build-'+stamp()+'.log')
    release,entry=build_release(root,release_id,log)
    # Snapshot immediately before changing services, so concurrent pre-build edits are preserved.
    folder=BACKUPS/('deploy-'+stamp());database_backups(folder)
    record=take_configuration_backup(folder,release_id)
    changes={SITE_CONF:proposed.encode(),SNIPPET:NGINX.encode(),UNITS/'mikoshi-gateway.service':GATEWAY.encode(),
             UNITS/'mikoshi-web.service':web_unit(entry).encode(),UNITS/'mikoshi-backup.service':DAILY.encode(),UNITS/'mikoshi-backup.timer':TIMER.encode()}
    record['deployedFiles']={str(p):digest(data) for p,data in changes.items()}
    fixed(folder/'deployment.json',json.dumps(record,indent=2).encode(),0o600)
    try:
        for path,data in changes.items(): fixed(path,data)
        run('nginx','-t')
        activate(release);run('systemctl','daemon-reload')
        run('systemctl','restart','mikoshi-gateway.service');health(8878,'/healthz');health(8878,'/kol-studio/api/state',401)
        bootstrap()
        run('systemctl','restart','mikoshi-web.service');health(3118,'/mikoshi/login')
        run('systemctl','reload','nginx');public_checks()
        run('systemctl','enable','mikoshi-gateway.service','mikoshi-web.service')
        run('systemctl','enable','--now','mikoshi-backup.timer')
        run('systemctl','start','mikoshi-backup.service')
    except BaseException:
        restore(folder,record,check_current=False)
        raise
    fixed(folder/'SUCCESS.json',json.dumps({'release':release_id,'url':ORIGIN+'/mikoshi/login','completedAt':stamp(),'database':'shared existing KOL workspace; never seeded'}).encode(),0o600)
    print('Mikoshi deployed: '+ORIGIN+'/mikoshi/login')
    print('Release: '+release_id+' | rollback record: '+str(folder))
    print('Bootstrap invitation, if needed, is in the private gateway state directory; no code was printed.')

def main():
    cli=argparse.ArgumentParser();cli.add_argument('root',nargs='?',type=Path);cli.add_argument('--verify-only',action='store_true')
    cli.add_argument('--backup-only',action='store_true');cli.add_argument('--rollback',type=Path)
    args=cli.parse_args()
    if args.verify_only:
        if not args.root: cli.error('release root required')
        meta,release_id=verify(args.root);print(f'Manifest verified: {release_id}, {len(meta["files"])} files');return
    if not hasattr(os,'geteuid') or os.geteuid()!=0: raise SystemExit('Run deployment, backup or rollback through sudo on the registered server.')
    import fcntl
    lock_path='/run/lock/mikoshi-backup.lock' if args.backup_only else '/run/lock/mikoshi-release.lock'
    with open(lock_path,'a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        if args.backup_only:
            BACKUPS.mkdir(parents=True,exist_ok=True,mode=0o700);database_backups(BACKUPS/('daily-'+stamp()));return
        if args.rollback:
            folder=args.rollback.resolve()
            if folder.parent!=BACKUPS.resolve() or not folder.name.startswith('deploy-'): raise ValueError('Rollback must reference a registered deployment backup.')
            restore(folder,json.loads((folder/'deployment.json').read_bytes()));print('Code/configuration rollback completed; databases and backups were retained.');return
        if not args.root: cli.error('release root required')
        _,release_id=verify(args.root);deploy(args.root.resolve(),release_id)

if __name__=='__main__': main()
