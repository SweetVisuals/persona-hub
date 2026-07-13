CREATE TABLE analytics_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE CASCADE,
  followers bigint DEFAULT 0,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Index for faster trend querying
CREATE INDEX idx_analytics_history_account_date ON analytics_history (social_account_id, date);
