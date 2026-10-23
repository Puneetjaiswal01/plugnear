"""Static preview with the clean-HTML redirects used by our Vercel deployment."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

root = Path(__file__).resolve().parents[1] / "apps/website/dist"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)

    def do_GET(self):
        url = urlsplit(self.path)
        aliases = {"/find": "/app/?mode=find", "/host": "/app/?mode=host", "/fleet": "/fleet-pilot/", "/fleet-planner": "/fleet-pilot/"}
        if url.path.rstrip("/") in aliases:
            self.send_response(307)
            self.send_header("Location", aliases[url.path.rstrip("/")])
            self.end_headers()
            return
        candidate = root / url.path.lstrip("/")
        if url.path.endswith(".html") and candidate.is_file():
            self.send_response(308)
            self.send_header("Location", urlunsplit(("", "", url.path[:-5], url.query, "")))
            self.end_headers()
            return
        super().do_GET()

    def translate_path(self, path):
        target = Path(super().translate_path(path))
        if not target.exists() and target.with_suffix(".html").is_file():
            return str(target.with_suffix(".html"))
        return str(target)

ThreadingHTTPServer(("127.0.0.1", 4175), Handler).serve_forever()
