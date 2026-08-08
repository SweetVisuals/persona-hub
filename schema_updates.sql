CREATE TABLE automation_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'scheduled',
  scheduled_for timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  level text DEFAULT 'info',
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Note: Ensure Realtime is enabled for the `logs` table in the Supabase Dashboard!
-- Go to Database -> Replication -> Click 'Source' next to supabase_realtime -> Toggle 'logs'

CREATE TABLE audio_extractions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  source_type text NOT NULL, -- 'youtube' or 'upload'
  source_url text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  mp3_url text,
  lyrics text,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Note: Enable Realtime for `audio_extractions` to get instant UI updates!
