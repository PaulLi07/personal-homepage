CREATE TABLE maps (
    map_id TEXT PRIMARY KEY,
    scientific_as_of TEXT,
    schema_json TEXT NOT NULL CHECK (json_valid(schema_json))
);
CREATE TABLE regions (
    map_id TEXT NOT NULL REFERENCES maps(map_id),
    region_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    label TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, region_id), UNIQUE (map_id, ordinal)
);
CREATE TABLE region_members (
    map_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    member_region_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (map_id, region_id, member_region_id),
    FOREIGN KEY (map_id, region_id) REFERENCES regions(map_id, region_id),
    FOREIGN KEY (map_id, member_region_id) REFERENCES regions(map_id, region_id)
);
CREATE TABLE categories (
    map_id TEXT NOT NULL REFERENCES maps(map_id),
    category_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, category_id), UNIQUE (map_id, ordinal)
);
CREATE TABLE technologies (
    map_id TEXT NOT NULL REFERENCES maps(map_id),
    technology_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, technology_id), UNIQUE (map_id, ordinal)
);
CREATE TABLE experiments (
    map_id TEXT NOT NULL REFERENCES maps(map_id),
    experiment_id TEXT NOT NULL,
    source_path TEXT NOT NULL UNIQUE,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    name TEXT NOT NULL,
    primary_category_id TEXT NOT NULL,
    status_code TEXT NOT NULL,
    status_as_of TEXT,
    is_europe INTEGER CHECK (is_europe IN (0, 1)),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, experiment_id),
    UNIQUE (map_id, ordinal),
    FOREIGN KEY (map_id, primary_category_id) REFERENCES categories(map_id, category_id)
);
CREATE TABLE experiment_regions (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (map_id, experiment_id, region_id),
    UNIQUE (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id),
    FOREIGN KEY (map_id, region_id) REFERENCES regions(map_id, region_id)
);
CREATE TABLE experiment_categories (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (map_id, experiment_id, category_id),
    UNIQUE (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id),
    FOREIGN KEY (map_id, category_id) REFERENCES categories(map_id, category_id)
);
CREATE TABLE experiment_technologies (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    technology_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    PRIMARY KEY (map_id, experiment_id, technology_id),
    UNIQUE (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id),
    FOREIGN KEY (map_id, technology_id) REFERENCES technologies(map_id, technology_id)
);
CREATE TABLE experiment_sources (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    url TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, experiment_id, source_id),
    UNIQUE (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id)
);
CREATE TABLE source_citations (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    json_pointer TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    source_id TEXT NOT NULL,
    PRIMARY KEY (map_id, experiment_id, json_pointer, ordinal),
    FOREIGN KEY (map_id, experiment_id, source_id) REFERENCES experiment_sources(map_id, experiment_id, source_id)
);
CREATE TABLE experiment_sites (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    country_code TEXT,
    latitude REAL,
    longitude REAL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id)
);
CREATE TABLE related_experiments (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    reference TEXT NOT NULL,
    relation_kind TEXT NOT NULL CHECK (relation_kind IN ('local', 'external-reference')),
    local_experiment_id TEXT,
    PRIMARY KEY (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id),
    FOREIGN KEY (map_id, local_experiment_id) REFERENCES experiments(map_id, experiment_id),
    CHECK ((relation_kind = 'local' AND local_experiment_id = reference) OR
           (relation_kind = 'external-reference' AND local_experiment_id IS NULL))
);
CREATE TABLE media_assets (
    map_id TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    path TEXT,
    sha256 TEXT,
    size_bytes INTEGER CHECK (size_bytes >= 0),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    PRIMARY KEY (map_id, experiment_id, ordinal),
    FOREIGN KEY (map_id, experiment_id) REFERENCES experiments(map_id, experiment_id),
    CHECK ((path IS NULL AND size_bytes IS NULL) OR
           (path IS NOT NULL AND sha256 IS NOT NULL AND length(sha256) = 64 AND size_bytes IS NOT NULL))
);
CREATE INDEX experiment_name_idx ON experiments(name);
CREATE INDEX experiment_region_idx ON experiment_regions(map_id, region_id);
CREATE INDEX experiment_category_idx ON experiment_categories(map_id, category_id);
CREATE INDEX experiment_technology_idx ON experiment_technologies(map_id, technology_id);
CREATE INDEX source_url_idx ON experiment_sources(url);
CREATE INDEX citation_source_idx ON source_citations(map_id, experiment_id, source_id);
