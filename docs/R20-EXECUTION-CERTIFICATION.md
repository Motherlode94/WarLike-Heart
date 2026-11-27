# R20 end-to-end certification checklist

- Confirm production D1 migration 0010 and owner-only session, GitHub read permission, separate scoped write credential and repository allowlists.
- Keep HEART_GITHUB_EXECUTION_CERTIFIED unset until isolated test environment is ready. Enable only for a disposable repository, never a production branch for initial testing.
- Prepare a real single-file edit; compare displayed diff to pinned source. Verify wrong digest, stale head, expired approval, revoked permission and duplicate claim reject without writes.
- Confirm creation of exactly one heart-review/ branch, one commit and one draft PR. Confirm default branch unchanged.
- Simulate branch/commit/PR timeout and inspect reconciliation without retry. Verify operation receipt and CI matched to exact published SHA.
- Confirm no merge capability, no secrets in logs, no source persisted, account switching clears UI. Verify actual Pages production build and browser. Record evidence before enabling real writes.
