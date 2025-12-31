-- Create wood_profiles table for storing wood types and textures
CREATE TABLE IF NOT EXISTS wood_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  texture_url TEXT,
  price_per_sqft DECIMAL(10, 2) NOT NULL,
  color TEXT,
  wood_type TEXT NOT NULL,
  finish TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table for capturing customer information
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  project_type TEXT,
  selected_wood_id UUID REFERENCES wood_profiles(id),
  estimated_sqft DECIMAL(10, 2),
  estimated_price DECIMAL(10, 2),
  room_measurements JSONB,
  ar_session_data JSONB,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ar_sessions table for tracking AR measurements
CREATE TABLE IF NOT EXISTS ar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  room_dimensions JSONB,
  measurements JSONB,
  screenshots JSONB,
  session_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wood_profiles_wood_type ON wood_profiles(wood_type);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_lead_id ON ar_sessions(lead_id);

-- Enable Row Level Security
ALTER TABLE wood_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for wood profiles (everyone can view)
CREATE POLICY "Anyone can view wood profiles" ON wood_profiles
  FOR SELECT USING (true);

-- Allow anonymous inserts for leads (lead capture)
CREATE POLICY "Anyone can create leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Allow anonymous inserts for AR sessions
CREATE POLICY "Anyone can create AR sessions" ON ar_sessions
  FOR INSERT WITH CHECK (true);

-- For admin access, we'll add policies later when auth is set up
