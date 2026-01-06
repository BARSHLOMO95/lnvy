-- Add Gmail integration tables and columns

-- Add gmail connection status to user profiles
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS gmail_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gmail_email TEXT,
ADD COLUMN IF NOT EXISTS gmail_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_limit INTEGER DEFAULT 5;

-- Create table for storing Gmail OAuth tokens (encrypted)
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  gmail_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on gmail_tokens
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can access their own Gmail tokens"
  ON gmail_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Create table for tracking processed emails (avoid duplicates)
CREATE TABLE IF NOT EXISTS processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'processed', -- processed, rejected, error
  rejection_reason TEXT,
  UNIQUE(user_id, gmail_message_id)
);

-- Enable RLS on processed_emails
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own processed emails
CREATE POLICY "Users can access their own processed emails"
  ON processed_emails
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_emails_user_id ON processed_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_emails_gmail_id ON processed_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);

-- Function to update gmail_tokens updated_at
CREATE OR REPLACE FUNCTION update_gmail_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for gmail_tokens
DROP TRIGGER IF EXISTS gmail_tokens_updated_at ON gmail_tokens;
CREATE TRIGGER gmail_tokens_updated_at
  BEFORE UPDATE ON gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_tokens_updated_at();

-- Add comment
COMMENT ON TABLE gmail_tokens IS 'Stores encrypted Gmail OAuth tokens for each user';
COMMENT ON TABLE processed_emails IS 'Tracks emails that have been processed to avoid duplicates';
