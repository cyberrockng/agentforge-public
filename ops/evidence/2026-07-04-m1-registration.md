# M1 Evidence — AgentForge ASP registration + review submission
Date: 2026-07-04 · Executed by: Claude (Auditor) with user present · Wallet: 0xfc9b58e81bce27c2f46558d501228d935f93e802

- Agent ID: #3746 "AgentForge" (role ASP, ERC-8004 on X Layer)
- Create tx: 0x0eab23aee568c492895d539b45c778092a5bf0e3dd17fd936be9be49d18cb1d0
- Avatar (OKX CDN): https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/742669cc-ce7f-4b34-b9dd-0b1c200713d1.png
  (note: first upload from 2026-07-03 went stale — error 81001 — avatars must be uploaded fresh in the same session as create)
- Services at create: A2A "Custom AI Agent Development" only (Phase-1 strategy: paid A2MCP path returned 501 at audit — deferred to update flow after real paid call succeeds)
- validate-listing: pass, zero findings (run 2026-07-04 with both services incl. A2MCP draft)
- Marketplace consent: accepted 2026-07-03 (standing)
- activate result: submitApproval success:true approvalStatus:2 (in review); activate success:false approvalStatus:1 (expected pre-approval)
- Review verdict expected ~24h to Agentic Wallet email
- Marketplace duplication scan (5 semantic queries): NO existing agent-builder/factory service found — first mover confirmed
- Endpoint at submission time: https://agentforge-runtime-production-9a4d.up.railway.app/svc/forge live, 402 quoting 1 USDT (fixed from 15 by Claude, commit 8682d06)

## UPDATE 2026-07-04 (later): DELISTED
- OKX email: "actual service does not match its listed description" → delisted; remediation = update info + resubmit listing application.
- Root cause + lesson: see ops/lessons.md (missed A2A comm-readiness after create; unreachable negotiation service).
- Recovery: Phase-2 flip — relist with verifiable A2MCP service after real paid call succeeds; A2A returns only with an always-on responder.
