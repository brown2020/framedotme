# Decision Log

| ID | Decision | Evidence | Alternatives | Result |
| --- | --- | --- | --- | --- |
| DEC-001 | Use protection-only mode inside the active codebase pass. | Concrete React Doctor server-action errors; user requested repository-wide fixes. | Full auth UI/provider redesign. | Keeps repair bounded to confirmed server/session risks. |
| DEC-002 | Preserve the existing custom `frame_session` JWT and verify it consistently. | Session route and proxy already sign/verify HS256; Firebase Admin `verifySessionCookie` does not apply to this custom token. | Migrate proxy/session system to Firebase session cookies. | Avoids a broad auth architecture migration. |
| DEC-003 | Block AUTH-003 rather than accepting client IAP claims or disabling purchases. | No receipt/signature/provider verification payload or server integration exists. | Trust client event; silently disable IAP. | Requires product/external setup before secure behavior can be selected. |
