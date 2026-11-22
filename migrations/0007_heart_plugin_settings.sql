CREATE TABLE heart_plugin_settings (
 member_id TEXT NOT NULL, plugin_id TEXT NOT NULL, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL,
 PRIMARY KEY(member_id,plugin_id)
);
