-- =============================================
-- Baara Gne Sira - Schema Supabase
-- A executer dans Supabase SQL Editor
-- =============================================

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'En cours',
  type TEXT DEFAULT 'standard',
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'blue',
  sector TEXT,
  target TEXT,
  budget TEXT,
  team TEXT,
  extra_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des plans d'affaires
CREATE TABLE IF NOT EXISTS business_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Activer RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;

-- Politiques publiques (lecture/ecriture pour tous)
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Public delete projects" ON projects FOR DELETE USING (true);

CREATE POLICY "Public read business_plans" ON business_plans FOR SELECT USING (true);
CREATE POLICY "Public insert business_plans" ON business_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update business_plans" ON business_plans FOR UPDATE USING (true);
CREATE POLICY "Public delete business_plans" ON business_plans FOR DELETE USING (true);