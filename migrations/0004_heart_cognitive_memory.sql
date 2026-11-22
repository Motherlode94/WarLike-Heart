CREATE TABLE heart_cognitive_memory (
 member_id TEXT NOT NULL,
 id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('semantic','episodic','procedural','working')),
 title TEXT NOT NULL,
 content TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT '',
 revision INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 expires_at INTEGER,
 PRIMARY KEY(member_id,id),
 CHECK((kind='working' AND expires_at IS NOT NULL) OR (kind!='working' AND expires_at IS NULL))
);
CREATE INDEX heart_cognitive_lookup ON heart_cognitive_memory(member_id,kind,updated_at DESC);
