# Railway Runtime Public Deployment Evidence

Date: 2026-07-03

## Railway Project

- Workspace: `cyberrockng's Projects`
- Project: `agentforge-runtime`
- Project ID: `69746b99-9b71-4b9f-b40f-440ec496271a`
- Environment: `production`
- Service: `agentforge-runtime`
- Service ID: `552ebd86-3201-4ea8-baab-791b42d92bc9`
- Deployment ID: `00b4b7a9-ed13-4b93-8bf0-7bd73ce70406`
- Status: `SUCCESS`
- Public URL: `https://agentforge-runtime-production-9a4d.up.railway.app`
- Domain status: `ACTIVE`
- Target port: `8080`

## Deploy Notes

Initial deploy failed because the Dockerfile copied non-existent workspace-local `apps/runtime/node_modules`.
Second deploy built but failed startup because the runtime image used `npm run start` without root `package.json`.
Final Dockerfile starts the compiled server directly:

```text
CMD ["node", "apps/runtime/dist/server.js"]
```

Railway injects `PORT=8080`; container log showed:

```text
agentforge-runtime listening on 0.0.0.0:8080
```

## Public Health Check

Command:

```text
curl -i -sS https://agentforge-runtime-production-9a4d.up.railway.app/health
```

Result:

```text
HTTP/2 200
content-type: application/json
server: railway-hikari

{"ok":true,"service":"agentforge-runtime","status":"t0.2-shell"}
```

## Public x402 Unpaid Check

Command:

```text
curl -i -sS -X POST https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge -H 'Content-Type: application/json' -d '{"request":"build an agent"}'
```

Result:

```text
HTTP/2 402
cache-control: no-store
content-type: application/json
server: railway-hikari

{"x402Version":1,"error":"X-PAYMENT header is required","accepts":[{"scheme":"exact","network":"eip155:196","maxAmountRequired":"15000000","resource":"/svc/forge","description":"AgentForge pay-per-call service","mimeType":"application/json","payTo":"0xfc9b58e81bce27c2f46558d501228d935f93e802","maxTimeoutSeconds":300,"asset":"USDT","outputSchema":{"type":"object","properties":{"status":{"type":"string"},"receipt":{"type":"object"}}},"extra":{"serviceId":"forge","currency":"USDT","displayAmount":"15"}}]}
```

## Public Payment-Header Placeholder Check

Command:

```text
curl -i -sS -X POST https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge -H 'Content-Type: application/json' -H 'X-PAYMENT: test-placeholder' -d '{"request":"build an agent"}'
```

Result:

```text
HTTP/2 501
cache-control: no-store
content-type: application/json
server: railway-hikari

{"error":"not_implemented","message":"payment verification lands in T3.1"}
```

## Invariant Notes

- Public endpoint is HTTPS and not localhost.
- Unpaid path returns HTTP 402 with payment requirements.
- Payment-header path is an explicit 501 placeholder until T3.1.
- There is no fake payment-success path.
