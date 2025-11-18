-- Check event_tickets structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_tickets'
ORDER BY ordinal_position;
