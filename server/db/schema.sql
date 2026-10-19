-- India Labour Law Library Relational Database Schema
-- Compatible with SQLite3 and easily portable to PostgreSQL

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'subscriber' CHECK(role IN ('admin', 'editor', 'subscriber', 'guest')),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK(subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK(subscription_status IN ('active', 'trialing', 'past_due', 'cancelled')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_documents (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT NOT NULL,
    document_number TEXT,
    document_type TEXT NOT NULL CHECK(document_type IN ('act', 'code', 'rules', 'notification', 'amendment')),
    jurisdiction TEXT NOT NULL CHECK(jurisdiction IN ('central', 'state')),
    state TEXT NOT NULL DEFAULT 'Central (All India)',
    issuing_authority TEXT NOT NULL,
    subject_category TEXT NOT NULL CHECK(subject_category IN (
        'Wages & Remuneration',
        'Industrial Relations & Disputes',
        'Social Security & Benefits',
        'Occupational Safety & Health',
        'Shops & Commercial Establishments',
        'Contract & Migrant Labour',
        'Apprenticeship & Employment Exchanges'
    )),
    publication_date TEXT NOT NULL,
    effective_date TEXT,
    legal_status TEXT NOT NULL CHECK(legal_status IN ('draft', 'pending_verification', 'verified', 'superseded', 'archived')),
    superseded_by_id TEXT REFERENCES legal_documents(id) ON DELETE SET NULL,
    official_source_url TEXT NOT NULL,
    official_citation TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK(verification_status IN ('verified', 'unverified', 'disputed')),
    last_verified_date TEXT,
    verified_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    missing_fields TEXT DEFAULT '[]',
    summary TEXT NOT NULL,
    full_text TEXT NOT NULL,
    download_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    section_number TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS document_amendments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    amending_act_title TEXT NOT NULL,
    notification_number TEXT,
    amendment_date TEXT NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT
);

CREATE TABLE IF NOT EXISTS verification_audit_log (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, document_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_docs_slug ON legal_documents(slug);
CREATE INDEX IF NOT EXISTS idx_docs_jurisdiction_state ON legal_documents(jurisdiction, state);
CREATE INDEX IF NOT EXISTS idx_docs_status ON legal_documents(legal_status);
CREATE INDEX IF NOT EXISTS idx_docs_verification ON legal_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_docs_subject ON legal_documents(subject_category);
CREATE INDEX IF NOT EXISTS idx_sections_doc_order ON document_sections(document_id, order_index);
CREATE INDEX IF NOT EXISTS idx_audit_doc_id ON verification_audit_log(document_id);
