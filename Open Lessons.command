#!/bin/sh
# Double-click to open Maya's maths lessons in the browser (videos play inside the page this way).
cd "$(dirname "$0")"
PORT=8765
if ! curl -s "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
  # A tiny local web server that tells the browser not to cache, so lesson updates show straight away.
  python3 -c '
import http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", '$PORT'), H).serve_forever()
' >/dev/null 2>&1 &
  sleep 1
fi
open "http://127.0.0.1:$PORT/index.html"
echo "Lessons are open in your browser. You can close this window."
