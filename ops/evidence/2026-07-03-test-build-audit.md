# Test, Build, and Audit Evidence

Date: 2026-07-03

## Tests

Command:

```bash
npm test
```

Result:

```text
Test Files  3 passed (3)
Tests       16 passed (16)
```

## Build

Command:

```bash
npm run build
```

Result:

```text
@agentforge/runtime build passed
@agentforge/web build passed
@agentforge/core build passed
@agentforge/payments build passed
@agentforge/provenance build passed
```

## High-Severity Audit Gate

Command:

```bash
npm audit --audit-level=high
```

Result:

```text
Exit code 0. Known remaining advisories are moderate Next/PostCSS advisories; npm's suggested force fix remains a breaking downgrade.
```
