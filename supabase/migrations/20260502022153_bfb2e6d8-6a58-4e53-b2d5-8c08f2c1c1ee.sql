REVOKE EXECUTE ON FUNCTION public.set_journal_pin(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_journal_pin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_journal_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_journal_pin(TEXT) TO authenticated;