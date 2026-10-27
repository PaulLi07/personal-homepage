-- 人物项目维护结构；日期保留原始文本，成果原记录与补丁分层。
CREATE TABLE people (
    id TEXT PRIMARY KEY,
    ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal > 0),
    name TEXT NOT NULL,
    sort_year INTEGER NOT NULL CHECK (sort_year != 0),
    birth_json TEXT NOT NULL CHECK (json_valid(birth_json)),
    death_json TEXT CHECK (death_json IS NULL OR json_valid(death_json)),
    death_status TEXT NOT NULL,
    source_path TEXT NOT NULL REFERENCES source_documents(path),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json))
);
CREATE TABLE fields (id TEXT PRIMARY KEY);
CREATE TABLE person_fields (
    person_id TEXT NOT NULL REFERENCES people(id),
    field_id TEXT NOT NULL REFERENCES fields(id),
    role TEXT NOT NULL CHECK (role IN ('browse', 'navigation')),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (person_id, role, field_id), UNIQUE (person_id, role, ordinal)
);
CREATE TABLE events_raw (
    id TEXT PRIMARY KEY,
    source_path TEXT NOT NULL REFERENCES source_documents(path),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    title TEXT NOT NULL,
    date_json TEXT NOT NULL CHECK (json_valid(date_json)),
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    UNIQUE (source_path, ordinal)
);
CREATE TABLE event_people (
    event_id TEXT NOT NULL REFERENCES events_raw(id),
    person_id TEXT NOT NULL REFERENCES people(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (event_id, person_id), UNIQUE (event_id, ordinal)
);
CREATE TABLE event_represented_people (
    event_id TEXT NOT NULL REFERENCES events_raw(id),
    person_id TEXT NOT NULL REFERENCES people(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (event_id, person_id), UNIQUE (event_id, ordinal)
);
CREATE TABLE event_patches (
    id INTEGER PRIMARY KEY,
    stage INTEGER NOT NULL CHECK (stage IN (1, 2, 3)),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    event_id TEXT NOT NULL REFERENCES events_raw(id),
    source_path TEXT NOT NULL REFERENCES source_documents(path),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    UNIQUE (stage, ordinal)
);
CREATE TABLE patch_people (
    patch_id INTEGER NOT NULL REFERENCES event_patches(id),
    person_id TEXT NOT NULL REFERENCES people(id),
    role TEXT NOT NULL CHECK (role IN ('participant', 'represented')),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (patch_id, role, person_id), UNIQUE (patch_id, role, ordinal)
);
CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json))
);
CREATE INDEX sources_url ON sources(url);
CREATE TABLE person_sources (
    person_id TEXT NOT NULL REFERENCES people(id),
    source_id TEXT NOT NULL REFERENCES sources(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (person_id, ordinal)
);
CREATE TABLE event_sources (
    event_id TEXT NOT NULL REFERENCES events_raw(id),
    source_id TEXT NOT NULL REFERENCES sources(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (event_id, ordinal)
);
CREATE TABLE patch_sources (
    patch_id INTEGER NOT NULL REFERENCES event_patches(id),
    source_id TEXT NOT NULL REFERENCES sources(id),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (patch_id, ordinal)
);
CREATE TABLE media_assets (
    id TEXT PRIMARY KEY REFERENCES people(id),
    path TEXT NOT NULL,
    sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    kind TEXT NOT NULL,
    rights_status TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json))
);
CREATE INDEX events_raw_source_order ON events_raw(source_path, ordinal);
CREATE INDEX events_raw_type ON events_raw(event_type);
CREATE INDEX people_birth_order ON people(sort_year, ordinal);
