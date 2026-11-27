# HEART – WarLike MCP operational checklist

1. Configure HEART_WARLIKE_MCP_TOKEN as a Cloudflare secret matching the server-side MCP bearer, never commit it.
2. In Agent Engine as owner, enable the WarLike connector and grant read permission for warlike.tools.inspect.
3. Create a run for query tools, approve explicitly, then run. Inspect returned tool names and journal outcome.
4. A successful tools/list is discovery only, not proof of Engine session access or command execution.
5. Revoke permission or disable the connector when finished. Do not enable tools/call through this adapter.

Automated transport contract tests use a stub, not the deployed service. Live connectivity requires configured credentials and a separate authorized smoke test.
