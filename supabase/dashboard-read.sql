-- Applied to Coconut on 2026-10-11. Public, read-only sensor telemetry.
GRANT SELECT ON TABLE public.storage TO anon;
CREATE POLICY dashboard_read_sensor_data ON public.storage
FOR SELECT TO anon USING (true);
