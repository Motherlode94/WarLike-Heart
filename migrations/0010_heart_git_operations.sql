CREATE TABLE heart_git_operations (
 member_id TEXT NOT NULL,id TEXT NOT NULL,digest TEXT NOT NULL,repository TEXT NOT NULL,
 commit_sha TEXT NOT NULL,blob_sha TEXT NOT NULL,path TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','approved','running','done','failed','cancelled','expired')),
 created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,result TEXT,
 PRIMARY KEY(member_id,id)
);
CREATE INDEX heart_git_operations_recent ON heart_git_operations(member_id,created_at DESC);
