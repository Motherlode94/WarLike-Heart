# HEART release certification gates

Current automated checks cover syntax, unit behavior and selected API boundaries, not production certification.

Before stable release, record date, deployed commit and actual outcome for:
- signed WarLike account login/logout, account isolation and expired session;
- D1 readiness through migration 0009;
- real AI provider response, consent off/on and invalid model output;
- chat -> editable plan -> explicit approval -> execution -> history;
- MCP session discovery, explicitly allowed session, queued inspection and command result; verify rejection after permission revocation;
- browser desktop/mobile layout, navigation, account-switch data clearing;
- interrupted mission recovery and progress notices, once corresponding interfaces are wired.

Do not infer a pass from a green unit test or configuration flag. Keep release-candidate status until these checks have evidence.
