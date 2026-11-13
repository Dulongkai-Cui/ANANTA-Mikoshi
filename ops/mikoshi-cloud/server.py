"""Authenticated Mikoshi identity and complete KOL workspace gateway.

Bind loopback only; Nginx supplies TLS. No source DB or static assets are public.
"""
import argparse
import gzip
import json
import mimetypes
import re
import sqlite3
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / 'Components/kol-selection'
sys.path.insert(0, str(COMPONENT / 'upstream'))
from local_server import Store, Conflict, MAX_BODY, encode
from auth import AuthStore, AuthError, authenticate, require_write, handle_auth

DIST = COMPONENT / 'upstream/dist'
INTEGRATION = COMPONENT / 'integration'
STATIC = {'app.js', 'style.css', 'planner.js', 'planner-core.js', 'planner.css',
          'planner-defaults.json', 'factory.js', 'factory.css', 'graph-core.js',
          'performance.js', 'avatars.json', 'research.json', 'recent-works.json'}
ASSET = re.compile(r'assets/(?:works/up-[\w-]+\.json|avatars/[\w-]+\.(?:jpg|jpeg|png|webp|avif|gif))', re.ASCII)
CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; connect-src 'self'"
BODY_TIMEOUT_SECONDS = 15

def public_view(value):
    if isinstance(value, list): return [public_view(x) for x in value]
    if isinstance(value, dict):
        return {k:public_view(v) for k,v in value.items() if k not in {'original','sourceSnapshot','sourceHTMLSha256','audit','localPath'}}
    if isinstance(value,str) and re.match(r'^(?:[A-Za-z]:[\\/]|\\\\)',value): return re.split(r'[\\/]',value)[-1]
    return value

class Handler(BaseHTTPRequestHandler):
    server_version = 'Mikoshi'
    sys_version = ''
    def log_message(self, *args): pass

    def setup(self):
        super().setup()
        self.connection.settimeout(getattr(self.server, 'body_timeout', BODY_TIMEOUT_SECONDS))

    def reply(self, status, body=b'', mime='application/json; charset=utf-8', headers=()):
        if isinstance(body,dict): body=encode(body).encode()
        self.send_response(status)
        for k,v in [('Content-Type',mime),('Cache-Control','private, no-store'),('X-Content-Type-Options','nosniff'),
                    ('X-Robots-Tag','noindex, nofollow, noarchive'),('Referrer-Policy','no-referrer'),
                    ('Content-Security-Policy',CSP),('Vary','Cookie, Accept-Encoding')]: self.send_header(k,v)
        if len(body)>1800 and not mime.startswith('image/') and 'gzip' in self.headers.get('Accept-Encoding',''):
            body=gzip.compress(body,compresslevel=3); self.send_header('Content-Encoding','gzip')
        for k,v in headers: self.send_header(k,v)
        self.send_header('Content-Length',str(len(body))); self.end_headers()
        if self.command!='HEAD': self.wfile.write(body)

    def read_body(self, maximum):
        if self.headers.get('Transfer-Encoding'):
            raise AuthError(400,'invalid_request','不支持此请求格式。')
        lengths=self.headers.get_all('Content-Length', [])
        if len(lengths)!=1 or not re.fullmatch(r'[0-9]{1,10}',lengths[0]):
            raise AuthError(400,'invalid_request','请求长度无效。')
        size=int(lengths[0])
        if not 0<size<=maximum: raise AuthError(413,'body_too_large','请求过大或为空。')
        # Finish a bounded upload before sending a denial. Closing while a client is still
        # sending a multi-MB workspace caused TCP reset instead of the intended 401/403.
        # This is byte reception only: identity/role/Origin/CSRF still gate JSON and Store.save.
        deadline=time.monotonic()+self.server.body_timeout
        previous_timeout=self.connection.gettimeout()
        chunks=bytearray()
        try:
            while len(chunks)<size:
                remaining=deadline-time.monotonic()
                if remaining<=0: raise TimeoutError
                self.connection.settimeout(remaining)
                part=self.rfile.read1(min(65536,size-len(chunks)))
                if not part: raise AuthError(400,'incomplete_body','请求正文未完整接收。')
                chunks.extend(part)
        except TimeoutError:
            raise AuthError(408,'request_timeout','请求上传超时，请重试。') from None
        finally:
            self.connection.settimeout(previous_timeout)
        if self.headers.get_content_type()!='application/json':
            raise AuthError(415,'invalid_content_type','请使用 JSON 请求。')
        return bytes(chunks)

    def handle_request(self):
        path=unquote(urlsplit(self.path).path)
        method='GET' if self.command=='HEAD' else self.command
        auth_path=path.startswith('/mikoshi-api/auth/')
        body=self.read_body(8192 if auth_path else MAX_BODY) if method in ('POST','PUT') else b''
        if path=='/healthz' and method=='GET': return self.reply(200,{'ok':True})
        if auth_path:
            result=handle_auth(self.server.auth,method,path.removeprefix('/mikoshi-api'),self.headers,body,
                              self.headers.get('X-Real-IP',self.client_address[0]),self.server.origin,self.server.secure_cookie)
            return self.reply(result.status,result.body,headers=result.headers)
        context=authenticate(self.server.auth,self.headers.get('Cookie',''))
        if not context: return self.reply(401,{'error':'请先登录 Mikoshi。'})
        if path=='/kol-studio': return self.reply(308,headers=[('Location','/kol-studio/')])
        if not path.startswith('/kol-studio/'):
            return self.reply(404,{'error':'页面不存在。'})
        name=path.removeprefix('/kol-studio/')
        if method=='PUT' and name=='api/state':
            if context.role not in ('admin','editor'): return self.reply(403,{'error':'当前账号仅可查看。'})
            require_write(context,self.headers,self.server.origin)
            payload=json.loads(body)
            return self.reply(200,self.server.store.save(payload))
        if method!='GET': return self.reply(405,{'error':'不支持此操作。'})
        if name=='api/state':
            result=self.server.store.get()
            if not result['state']: raise OSError('Workspace unavailable')
            if context.role=='viewer': result['state']=public_view(result['state'])
            else: result['csrf']=context.csrf
            result['role']=context.role
            return self.reply(200,result)
        if name.startswith('api/history'):
            if context.role!='admin': return self.reply(403,{'error':'仅管理员可读取历史备份。'})
            if name=='api/history': return self.reply(200,{'items':self.server.store.history()})
            match=re.fullmatch(r'api/history/([a-f0-9-]{36})',name)
            if match:
                raw=self.server.store.revision(match[1])
                if raw is not None: return self.reply(200,raw,headers=[('Content-Disposition',f'attachment; filename="MIKOSHI-{match[1]}.json"')])
            return self.reply(404,{'error':'版本不存在。'})
        if name in ('','index.html'):
            html=(DIST/'index.html').read_text('utf-8')
            if context.role=='viewer':
                html=re.sub(r'src="persistence\.js[^"]*"','src="read.js"',html)
                html=html.replace('</head>','<link rel="stylesheet" href="read.css"></head>')
            html=html.replace('</head>','<link rel="stylesheet" href="embedded.css"></head>')
            html=html.replace('</body>','<script src="bridge.js"></script></body>')
            return self.reply(200,html.encode(),'text/html; charset=utf-8')
        if name=='data.json': return self.reply(200,{})  # Never fall back to obsolete seed data.
        if name=='persistence.js':
            return self.reply(200,(COMPONENT/'upstream/cloud/persistence.js').read_bytes(),'text/javascript; charset=utf-8')
        if name in ('read.js','read.css'):
            content=(COMPONENT/'upstream/team-preview'/name).read_bytes()
            if name.endswith('.js'):
                content=content.replace(b"'/api/state'",b"'/kol-studio/api/state'")
            return self.reply(200,content,'text/javascript; charset=utf-8' if name.endswith('.js') else 'text/css; charset=utf-8')
        if name in ('bridge.js','embedded.css'):
            return self.reply(200,(INTEGRATION/name).read_bytes(),'text/javascript; charset=utf-8' if name.endswith('.js') else 'text/css; charset=utf-8')
        if name in STATIC or ASSET.fullmatch(name):
            file=DIST/name
            if not file.is_file(): return self.reply(404,{'error':'资源不存在。'})
            content=file.read_bytes()
            if name=='planner.js': content=content.replace(b'/api/history',b'/kol-studio/api/history')
            if name=='app.js':
                text=content.decode('utf-8')
                for before,after in [('本机数据库已连接','团队数据库已连接'),('本机 SQLite 数据库中。','团队服务器数据库中。'),('本机资料服务','团队资料服务')]:
                    text=text.replace(before,after)
                content=text.encode('utf-8')
            if context.role=='viewer' and name in ('avatars.json','research.json'):
                content=encode(public_view(json.loads(content))).encode()
            mime={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'}.get(file.suffix,mimetypes.guess_type(name)[0] or 'application/octet-stream')
            return self.reply(200,content,mime)
        return self.reply(404,{'error':'页面不存在。'})

    def dispatch(self):
        try: self.handle_request()
        except AuthError as exc: self.reply(exc.status,{'error':exc.message,'code':exc.code})
        except Conflict as exc: self.reply(409,{'error':str(exc)})
        except (ConnectionResetError,BrokenPipeError): pass
        except (OSError,sqlite3.Error): self.reply(503,{'error':'资料服务暂时不可用，请稍后重试。'})
        except (ValueError,KeyError,TypeError,AttributeError): self.reply(400,{'error':'请求格式无效，请检查后重试。'})

    do_GET=do_HEAD=do_POST=do_PUT=dispatch

def make_server(port, database, auth_database, origin):
    if not database.is_file(): raise ValueError('Missing workspace database; refusing to seed/overwrite.')
    if urlsplit(origin).scheme not in ('http','https') or urlsplit(origin).path:
        raise ValueError('Origin must be an exact scheme/host/port without a path')
    srv=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    srv.body_timeout=BODY_TIMEOUT_SECONDS
    srv.store=Store(database)
    if not srv.store.get()['state']: raise ValueError('Workspace is empty')
    srv.auth=AuthStore(auth_database); srv.origin=origin; srv.secure_cookie=origin.startswith('https://')
    return srv

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8878)
    parser.add_argument('--database',type=Path,required=True)
    parser.add_argument('--auth-database',type=Path,required=True)
    parser.add_argument('--origin',required=True)
    args=parser.parse_args()
    make_server(args.port,args.database,args.auth_database,args.origin).serve_forever()
