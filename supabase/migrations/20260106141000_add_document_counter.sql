-- Add function to increment document count
CREATE OR REPLACE FUNCTION increment_document_count(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET document_count = COALESCE(document_count, 0) + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_document_count(UUID) TO authenticated, service_role;
