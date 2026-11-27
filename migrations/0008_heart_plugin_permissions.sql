CREATE TABLE heart_plugin_permissions (
 member_id TEXT NOT NULL, action TEXT NOT NULL,
 permission TEXT NOT NULL CHECK(permission IN ('read','diagnostic')),
 granted INTEGER NOT NULL CHECK(granted IN (0,1)),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(member_id,action,permission)
);
