-- Function to safely decrement user render entitlements
-- This prevents race conditions and ensures atomic updates

CREATE OR REPLACE FUNCTION decrement_user_renders(
  user_id UUID,
  render_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  field_name TEXT;
BEGIN
  -- Determine which field to update
  IF render_type = 'freemium' THEN
    field_name := 'free_renders_remaining';
  ELSIF render_type = 'premium' THEN
    field_name := 'premium_renders_remaining';
  ELSE
    RAISE EXCEPTION 'Invalid render_type: %', render_type;
  END IF;

  -- Lock the user row and get current count
  IF render_type = 'freemium' THEN
    SELECT free_renders_remaining INTO current_count
    FROM users 
    WHERE id = user_id
    FOR UPDATE;
  ELSE
    SELECT premium_renders_remaining INTO current_count
    FROM users 
    WHERE id = user_id
    FOR UPDATE;
  END IF;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;

  -- Check if user has renders remaining
  IF current_count <= 0 THEN
    RAISE EXCEPTION 'No % renders remaining for user %', render_type, user_id;
  END IF;

  -- Decrement the count
  IF render_type = 'freemium' THEN
    UPDATE users 
    SET free_renders_remaining = free_renders_remaining - 1,
        updated_at = NOW()
    WHERE id = user_id;
  ELSE
    UPDATE users 
    SET premium_renders_remaining = premium_renders_remaining - 1,
        updated_at = NOW()
    WHERE id = user_id;
  END IF;

  -- Log the entitlement usage
  INSERT INTO card_analytics (
    user_id,
    event_type,
    tier,
    metadata,
    created_at
  ) VALUES (
    user_id,
    'entitlement_consumed',
    render_type,
    jsonb_build_object(
      'previous_count', current_count,
      'new_count', current_count - 1
    ),
    NOW()
  );

END;
$$;
