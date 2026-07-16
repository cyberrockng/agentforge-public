# Runtime Health Curl Evidence

Date: 2026-07-03

Command:

```bash
curl -sS -i http://127.0.0.1:4010/health
```

Output:

```text
HTTP/1.1 200 OK
content-type: application/json
Date: Fri, 03 Jul 2026 21:09:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{"ok":true,"service":"agentforge-runtime","status":"t0.2-shell"}
```

