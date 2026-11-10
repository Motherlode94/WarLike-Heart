-- Applied to EU-jurisdiction D1 database warlike-heart-memory.
-- Account identity is derived from the signed, short-lived Heart session on the server.
CREATE TABLE IF NOT EXISTS heart_snapshots (
  member_id TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(length(content) <= 200000)
);
