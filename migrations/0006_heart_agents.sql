CREATE TABLE heart_agent_runs (
 member_id TEXT NOT NULL,id TEXT NOT NULL,action TEXT NOT NULL,query TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','approved','running','done','failed','cancelled')),
 result TEXT, created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,
 PRIMARY KEY(member_id,id)
);
CREATE TABLE heart_agent_events (
 member_id TEXT NOT NULL,run_id TEXT NOT NULL,seq INTEGER NOT NULL,event TEXT NOT NULL,at INTEGER NOT NULL,
 PRIMARY KEY(member_id,run_id,seq),
 FOREIGN KEY(member_id,run_id) REFERENCES heart_agent_runs(member_id,id) ON DELETE CASCADE
);
CREATE INDEX heart_agent_runs_owner ON heart_agent_runs(member_id,updated_at DESC);
