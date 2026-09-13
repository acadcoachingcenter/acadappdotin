-- Adds the learning_resources table, replacing the hardcoded "Learning
-- Websites" sidebar list in Layout.jsx with an admin-manageable one.
-- Run once: npx wrangler d1 execute acad-db --remote --file=./add_learning_resources.sql

CREATE TABLE IF NOT EXISTS learning_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now'))
);

-- Seed with the resources that were previously hardcoded, renumbered for
-- clear ordering. "Learning Resource 2" is renamed to "Explore Periodic
-- Table" so the button itself says what it links to, instead of only being
-- clear after clicking. The new LEARNERA.AI resource is added here too.
INSERT INTO learning_resources (id, title, url, display_order, is_active) VALUES
  ('lr-phet-simulations', 'PhET Simulations', 'https://phet.colorado.edu/', 1, 1),
  ('lr-resource-1', 'Learning Resource 1', 'https://share.google/PuX3WnxzJoYGQQuRQ', 2, 1),
  ('lr-periodic-table', 'Explore Periodic Table', 'https://share.google/ZSKrUcW2GF8okeBwS', 3, 1),
  ('lr-learnera-ai', 'LEARNERA.AI: UBC Deep Learning & NLP Group', 'https://share.google/bOwei0CqoWMqaSsOU', 4, 1);
