CREATE TABLE heart_graph_nodes (
 member_id TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,label TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT '', confidence INTEGER NOT NULL CHECK(confidence BETWEEN 0 AND 100),
 PRIMARY KEY(member_id,id), UNIQUE(member_id,kind,label COLLATE NOCASE)
);
CREATE TABLE heart_graph_edges (
 member_id TEXT NOT NULL,id TEXT NOT NULL,from_id TEXT NOT NULL,to_id TEXT NOT NULL,
 relation TEXT NOT NULL,source TEXT NOT NULL DEFAULT '',confidence INTEGER NOT NULL CHECK(confidence BETWEEN 0 AND 100),
 PRIMARY KEY(member_id,id), UNIQUE(member_id,from_id,to_id,relation),
 FOREIGN KEY(member_id,from_id) REFERENCES heart_graph_nodes(member_id,id) ON DELETE CASCADE,
 FOREIGN KEY(member_id,to_id) REFERENCES heart_graph_nodes(member_id,id) ON DELETE CASCADE,
 CHECK(from_id<>to_id)
);
CREATE INDEX heart_graph_target ON heart_graph_edges(member_id,to_id);
