# Auth Validation

| Check | Command Or Manual Path | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Static quality | `npm run lint` | Pass | no output warnings/errors | Full repo |
| Type/routing integration | `npm run build` | Pass | compile, TypeScript, 16 pages | Full repo |
| Server action auth | React Doctor changed scope | Pass | no issues; 90/100 | Previously two errors |
| Session verifier | Source review/build | Pass | custom HS256 `jwtVerify`, cookie reader, required guard | Firebase session-cookie mismatch removed |
| CSRF initial login | Source review/build/local HTTP | Pass | GET bootstrap returns 200; POST without CSRF returns 403 | Invalid mutation fails closed |
| Safe return path | Source review/build | Pass | `//` and backslash values rejected | Normal `/path?...` preserved |
| Email-link error timer | React Doctor/source review | Pass | timeout cleanup returned | Manual browser QA not run |
| Protected route signed out | Local HTTP smoke | Pass | `/capture` and `/profile` return 307 to `/` | Proxy dev server |
| Public route signed out | Local HTTP smoke | Pass | `/` and `/about` return 200 | Proxy dev server |
| Credit/IAP authority | Architecture review | Blocked | AUTH-003 | Requires provider receipt/server policy |
