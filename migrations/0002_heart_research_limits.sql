-- Research request quotas, no query logs; member identity comes from the signed Heart session.
CREATE TABLE IF NOT EXISTS heart_research_limits (
 member_id TEXT NOT NULL,
 day TEXT NOT NULL,
 hits INTEGER NOT NULL DEFAULT 0 CHECK(hits>=0),
 PRIMARY KEY(member_id,day)
);
