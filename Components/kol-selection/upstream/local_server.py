"""Local ANANTA workbench. One committed SQLite transaction per user save."""
import argparse
import gzip
import json
import sqlite3
import uuid
from contextlib import closing
from datetime import date, datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

BASE = Path(__file__).resolve().parent
DIST = BASE / "dist"
HISTORY_LIMIT = 12
MAX_BODY = 18_000_000

def timestamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

class Conflict(Exception):
    pass

def validate_plan(state):
    p = state.get("planner")
    if not isinstance(p, dict) or p.get("schema") != 1:
        raise ValueError("请刷新后载入排期功能，再保存。")
    if any(not isinstance(p.get(key), list) for key in ("ideaIds","matches","nodes","events")):
        raise ValueError("中选池或排期的格式不完整。")
    def index(rows):
        result = {row["id"]:row for row in rows}
        if len(result) != len(rows) or any(not isinstance(k,str) or not k for k in result):
            raise ValueError("存在重复或无效的记录编号。")
        return result
    kols = {k for k,v in index(state["kols"]).items() if v.get("selected")}
    ideas = set(index(state["ideas"]))
    chosen = set(p["ideaIds"])
    if len(chosen) != len(p["ideaIds"]) or not chosen <= ideas:
        raise ValueError("中选创意缺失或重复。")
    nodes, matches = index(p["nodes"]), index(p["matches"])
    index(p["events"])
    signatures=set()
    for pair in matches.values():
        members = pair["kolIds"]
        if not isinstance(members,list) or not members or len(set(members)) != len(members) or not set(members) <= kols or pair["ideaId"] not in chosen:
            raise ValueError("组合须引用已中选的人选和创意。")
        signature=(pair["ideaId"],*sorted(members))
        if signature in signatures:
            raise ValueError("这个组合已在池中。")
        signatures.add(signature)
    for node in nodes.values():
        parent = node.get("parentId")
        if not node["title"].strip() or parent and (parent not in nodes or nodes[parent].get("parentId")):
            raise ValueError("节点名称或层级无效。")
        if node.get("date"): date.fromisoformat(node["date"])
    valid_refs={"kol":kols,"idea":chosen,"match":set(matches)}
    for event in p["events"]:
        refs=event["refs"]
        precision=event.get("precision","day")
        if precision=="node":
            if not event.get("nodeId") or event.get("start") or event.get("end") or event.get("time"):
                raise ValueError("节点暂排请选择节点并留空日期。")
        elif precision in ("day","week"):
            start, end = date.fromisoformat(event["start"]), date.fromisoformat(event["end"])
            if not 0 <= (end-start).days <= 365 or precision=="week" and (start.weekday()!=0 or (end-start).days!=6 or event.get("time")):
                raise ValueError("请核对日程起止日期或周范围。")
        else:
            raise ValueError("排期层级无效。")
        if not event["title"].strip() or event["status"] not in ("暂排","已确认","已完成"):
            raise ValueError("排期标题、日期或状态无效。")
        if event.get("nodeId") and event["nodeId"] not in nodes:
            raise ValueError("排期引用了不存在的节点。")
        if not isinstance(refs,list) or any(r["id"] not in valid_refs.get(r["kind"],set()) for r in refs):
            raise ValueError("排期引用的人选、创意或组合无效。")
        if len({(r["kind"],r["id"]) for r in refs})!=len(refs):
            raise ValueError("排期对象重复。")
        if event.get("time"): datetime.strptime(event["time"],"%H:%M")


def validate_factory(state):
    factory=state.get("brainFactory")
    if factory is None:return
    if not isinstance(factory,dict) or factory.get("schema")!=1 or not isinstance(factory.get("blocks"),list) or not isinstance(factory.get("templates"),list):
        raise ValueError("脑暴工厂画布格式无效。")
    blocks=factory["blocks"];keys=set();bases=set()
    import math
    for b in blocks:
        if not isinstance(b,dict) or not isinstance(b.get("id"),str) or not b["id"] or b["id"] in keys or b.get("type") not in ("base","node","sell","kol","price","note"):
            raise ValueError("存在无效或重复的组件。")
        if any(type(b.get(k)) not in (int,float) or not math.isfinite(b[k]) for k in ("x","y")):raise ValueError("组件位置无效。")
        keys.add(b["id"])
        if b["type"]=="base":bases.add(b["id"])
    for b in blocks:
        if b.get("parent") and (b["parent"] not in bases or b["type"]=="base"):raise ValueError("标准件缺少创意底板。")

def archive(db,row):
    if row:
        version,body,saved=row
        db.execute("INSERT OR IGNORE INTO state_history(version,body,saved_at) VALUES (?,?,?)",
                   (version,gzip.compress(body.encode(),compresslevel=3),saved or timestamp()))
        db.execute("DELETE FROM state_history WHERE seq NOT IN (SELECT seq FROM state_history ORDER BY seq DESC LIMIT ?)",(HISTORY_LIMIT,))

class Store:
    def __init__(self,path):
        self.path = path
        path.parent.mkdir(parents=True,exist_ok=True)
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY,version TEXT,body TEXT,saved_at TEXT)")
            if "saved_at" not in {r[1] for r in db.execute("PRAGMA table_info(state)")}:
                db.execute("ALTER TABLE state ADD COLUMN saved_at TEXT")
            db.execute("CREATE TABLE IF NOT EXISTS state_history(seq INTEGER PRIMARY KEY,version TEXT UNIQUE,body BLOB NOT NULL,saved_at TEXT NOT NULL)")
            row = self.read(db)
            if row:
                state=json.loads(row[1])
                if "planner" not in state:
                    state["planner"]=json.loads((DIST/"planner-defaults.json").read_text(encoding="utf-8"))
                    validate_plan(state)
                    archive(db,(row[0],row[1],row[2] or state.get("updatedAt")))
                    self.write(db,state)
    def connect(self):
        db=sqlite3.connect(self.path,timeout=8)
        db.execute("PRAGMA synchronous=FULL")
        return db
    @staticmethod
    def read(db):
        return db.execute("SELECT version,body,saved_at FROM state WHERE id=1").fetchone()
    @staticmethod
    def write(db,state):
        version, saved = str(uuid.uuid4()),timestamp()
        db.execute("INSERT OR REPLACE INTO state(id,version,body,saved_at) VALUES (1,?,?,?)",(version,encode(state),saved))
        return {"version":version,"savedAt":saved}
    def get(self):
        with closing(self.connect()) as db:
            row=self.read(db)
        return {"version":row[0] if row else None, "state":json.loads(row[1]) if row else None,
                "savedAt":row[2] if row else None,"storage":"sqlite"}
    def save(self,payload):
        state=payload["state"]
        if not all(isinstance(state.get(k),list) for k in ("kols","ideas","budgets")):
            raise ValueError("工作台数据不完整。")
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            row=self.read(db)
            if (row[0] if row else None)!=payload.get("version"):
                raise Conflict("此窗口版本已过期，请刷新载入最新保存后重试。")
            if row and "planner" not in state:
                raise Conflict("当前窗口使用旧版工作台，请刷新后再保存。")
            if row and "brainFactory" not in state and "brainFactory" in json.loads(row[1]):
                raise Conflict("请刷新后再修改，当前版本需要保留脑暴画布。")
            validate_plan(state)
            validate_factory(state)
            archive(db,row)
            return self.write(db,state)
    def history(self):
        with closing(self.connect()) as db:
            return [{"version":v,"savedAt":s} for v,s in db.execute("SELECT version,saved_at FROM state_history ORDER BY seq DESC")]
    def revision(self,version):
        with closing(self.connect()) as db:
            row=db.execute("SELECT body FROM state_history WHERE version=?",(version,)).fetchone()
        return gzip.decompress(row[0]) if row else None

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(DIST),**kwargs)
    def send_body(self,raw,status=200,attachment=None):
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("Content-Length",str(len(raw)))
        if attachment:
            self.send_header("Content-Disposition",f'attachment; filename="ANANTA-{attachment}.json"')
        self.end_headers()
        self.wfile.write(raw)
    def json(self,data,status=200):
        self.send_body(encode(data).encode(),status)
    def do_GET(self):
        path=urlsplit(self.path).path
        try:
            if path=="/api/state": return self.json(self.server.store.get())
            if path=="/api/history": return self.json({"items":self.server.store.history()})
            if path.startswith("/api/history/"):
                version=path.rsplit("/",1)[-1]
                if len(version)==36:
                    raw=self.server.store.revision(version)
                    if raw is not None: return self.send_body(raw,attachment=version)
                return self.json({"error":"版本不存在"},404)
            return super().do_GET()
        except (sqlite3.Error,OSError,ValueError):
            return self.json({"error":"数据库读取失败，请检查本机数据文件后重试。"},503)
    def do_PUT(self):
        if self.path!="/api/state": return self.json({"error":"接口不存在"},404)
        try:
            origin=self.headers.get("Origin")
            if origin and urlsplit(origin).netloc!=self.headers.get("Host"):
                return self.json({"error":"请在本机工作台保存。"},403)
            if self.headers.get_content_type()!="application/json": return self.json({"error":"需要 JSON"},415)
            length=int(self.headers.get("Content-Length","0"))
            if not 0<length<=MAX_BODY: return self.json({"error":"数据过大或为空。"},413)
            payload=json.loads(self.rfile.read(length))
            result=self.server.store.save(payload)
        except Conflict as exc:
            return self.json({"error":str(exc)},409)
        except (KeyError,TypeError,ValueError,AttributeError) as exc:
            return self.json({"error":str(exc) if isinstance(exc,ValueError) else "数据字段无效。"},400)
        except (OSError,sqlite3.Error):
            return self.json({"error":"数据库写入失败，请检查磁盘空间后重试。"},503)
        self.json(result)
    def log_message(self,*args):
        pass

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--port",type=int,default=8767)
    parser.add_argument("--database",type=Path,default=BASE/"user-data"/"workspace.sqlite")
    args=parser.parse_args()
    server=ThreadingHTTPServer(("127.0.0.1",args.port),Handler)
    server.store=Store(args.database)
    print(f"Local: http://127.0.0.1:{args.port}",flush=True)
    server.serve_forever()

