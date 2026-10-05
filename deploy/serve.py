"""Serve the built app and pass /api/* through to the API, so the page talks to one address.

    API_URL=http://127.0.0.1:8095 python3 deploy/serve.py --port 8096 --root dist/personal-task-manager/browser

Standard library only.
"""
from __future__ import annotations

import argparse
import os
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8095").rstrip("/")
HOP = {"connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailers", "host"}


class Handler(SimpleHTTPRequestHandler):
    def _proxy(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        headers = {k: v for k, v in self.headers.items() if k.lower() not in HOP}
        req = urllib.request.Request(API_URL + self.path, data=body, method=self.command, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                status, rheaders, data = res.status, res.getheaders(), res.read()
        except urllib.error.HTTPError as e:
            status, rheaders, data = e.code, e.headers.items(), e.read()
        except OSError:
            self.send_error(502, "API not reachable")
            return
        self.send_response(status)
        for k, v in rheaders:
            if k.lower() not in HOP and k.lower() != "content-length":
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _route(self, static) -> None:  # type: ignore[no-untyped-def]
        if self.path.startswith("/api/"):
            self._proxy()
        else:
            static()

    def do_GET(self) -> None:
        self._route(super().do_GET)

    def do_HEAD(self) -> None:
        self._route(super().do_HEAD)

    def do_POST(self) -> None:
        self._route(lambda: self.send_error(405))

    def do_PUT(self) -> None:
        self._route(lambda: self.send_error(405))

    def do_PATCH(self) -> None:
        self._route(lambda: self.send_error(405))

    def do_DELETE(self) -> None:
        self._route(lambda: self.send_error(405))

    def end_headers(self) -> None:
        if not self.path.startswith("/api/"):
            # index.html must never be cached, so new builds show up right away
            if self.path in ("/", "/index.html"):
                self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8096)
    ap.add_argument("--root", default="dist/personal-task-manager/browser")
    args = ap.parse_args()
    server = ThreadingHTTPServer(("0.0.0.0", args.port), partial(Handler, directory=args.root))
    print(f"Serving {args.root} on :{args.port}, /api -> {API_URL}")
    server.serve_forever()


if __name__ == "__main__":
    main()
