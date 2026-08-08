CREATE TABLE IF NOT EXISTS public.verified_lyrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  audio_extraction_id UUID REFERENCES public.audio_extractions(id),
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  audio_duration FLOAT,
  lyrics JSONB NOT NULL,
  style JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.verified_lyrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.verified_lyrics FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.verified_lyrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.verified_lyrics FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.verified_lyrics FOR DELETE USING (true);
