CREATE TABLE heart_internal_missions (
 member_id TEXT NOT NULL,id TEXT NOT NULL,created_at INTEGER NOT NULL,
 completed INTEGER NOT NULL CHECK(completed IN (0,1)),summary TEXT NOT NULL,
 PRIMARY KEY(member_id,id)
);
CREATE INDEX heart_internal_missions_recent ON heart_internal_missions(member_id,created_at DESC);
