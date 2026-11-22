CREATE TABLE heart_goals (
 member_id TEXT NOT NULL,
 id TEXT NOT NULL,
 title TEXT NOT NULL,
 steps TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('planned','active','done','paused')),
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(member_id,id)
);
CREATE INDEX heart_goals_by_member ON heart_goals(member_id,updated_at DESC);
