-- WeFrotas | reserve exclusivity SQL smoke test.
-- Run ONLY on a Supabase development branch with the migration installed.
-- Every test entity is fictitious; the entire script ends in ROLLBACK.
BEGIN;

INSERT INTO public.organizations (id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000042', 'wefrotas-qa-temp-20261109', 'WeFrotas isolated QA')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wefrotas_workspace_state (organization_id)
VALUES ('00000000-0000-4000-8000-000000000042') ON CONFLICT DO NOTHING;
INSERT INTO public.wefrotas_drivers (organization_id, entity_id, data)
VALUES ('00000000-0000-4000-8000-000000000042','driver1','{"id":"driver1"}'::jsonb),
       ('00000000-0000-4000-8000-000000000042','driver2','{"id":"driver2"}'::jsonb);
INSERT INTO public.wefrotas_vehicles (organization_id, entity_id, data)
VALUES ('00000000-0000-4000-8000-000000000042','source','{"id":"source","km":31000,"vehicleSubstitutions":[{"id":"active-1","sourceVehicleId":"source","reserveVehicleId":"reserve","driverId":"driver1","reason":"manutencao","startDate":"2026-11-01","endDate":"","startKm":3000,"endKm":""}]}'::jsonb),
       ('00000000-0000-4000-8000-000000000042','reserve','{"id":"reserve","km":3000}'::jsonb),
       ('00000000-0000-4000-8000-000000000042','other','{"id":"other","km":9000}'::jsonb),
       ('00000000-0000-4000-8000-000000000042','spare','{"id":"spare","km":1000}'::jsonb);
SET CONSTRAINTS wefrotas_reserve_exclusivity IMMEDIATE;
CREATE TEMP TABLE wefrotas_qa_outcome (scenario text PRIMARY KEY, expected text, actual text) ON COMMIT DROP;

DO $reserve_sql_qa$
DECLARE
  scenario RECORD;
  observed text;
BEGIN
  FOR scenario IN
    SELECT * FROM (VALUES
      ('same_reserve','other','reserve','driver2','2026-11-04','', 'PT409'),
      ('same_driver','other','spare','driver1','2026-11-04','', 'PT409'),
      ('reserve_as_titular','reserve','spare','driver2','2026-11-04','', 'PT409'),
      ('same_day_inclusive','other','reserve','driver2','2026-11-01','2026-11-01','PT409'),
      ('missing_driver','other','spare','unknown','2026-11-04','', '22023'),
      ('invalid_km','other','spare','driver2','2026-11-04','2026-11-05','22023'),
      ('nonoverlap','other','reserve','driver2','2026-10-01','2026-10-10','OK')
    ) AS cases(id, source, reserve, driver, beginning, finish, expected)
  LOOP
    observed := 'OK';
    BEGIN
      UPDATE public.wefrotas_vehicles
        SET data = data || jsonb_build_object(
          'vehicleSubstitutions', jsonb_build_array(jsonb_build_object(
            'id','test-'||scenario.id, 'sourceVehicleId',scenario.source,
            'reserveVehicleId',scenario.reserve, 'driverId',scenario.driver,
            'reason','manutencao', 'startDate',scenario.beginning,
            'endDate',scenario.finish,'startKm',3000,
            'endKm',CASE WHEN scenario.id='invalid_km' THEN 2000
                         WHEN scenario.finish <> '' THEN 3200 ELSE '' END)))
        WHERE organization_id='00000000-0000-4000-8000-000000000042'
          AND entity_id=scenario.source;
      RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
    EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
              WHEN OTHERS THEN observed := SQLSTATE;
    END;
    INSERT INTO wefrotas_qa_outcome VALUES(scenario.id,scenario.expected,observed);
  END LOOP;

  observed:='OK';
  BEGIN
    UPDATE public.wefrotas_vehicles
      SET data = data - 'vehicleSubstitutions'
      WHERE organization_id='00000000-0000-4000-8000-000000000042' AND entity_id='source';
    RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
  EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
            WHEN OTHERS THEN observed:=SQLSTATE;
  END;
  INSERT INTO wefrotas_qa_outcome VALUES('erase_history','PT409',observed);

  observed:='OK';
  BEGIN
    UPDATE public.wefrotas_vehicles
      SET data=jsonb_set(data,'{vehicleSubstitutions}','[]'::jsonb)
      WHERE organization_id='00000000-0000-4000-8000-000000000042' AND entity_id='source';
    RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
  EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
            WHEN OTHERS THEN observed:=SQLSTATE;
  END;
  INSERT INTO wefrotas_qa_outcome VALUES('empty_history','PT409',observed);

  observed:='OK';
  BEGIN
    DELETE FROM public.wefrotas_vehicles
      WHERE organization_id='00000000-0000-4000-8000-000000000042' AND entity_id='reserve';
    RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
  EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
            WHEN OTHERS THEN observed:=SQLSTATE;
  END;
  INSERT INTO wefrotas_qa_outcome VALUES('delete_reserve','PT409',observed);

  observed:='OK';
  BEGIN
    DELETE FROM public.wefrotas_vehicles
      WHERE organization_id='00000000-0000-4000-8000-000000000042' AND entity_id='source';
    RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
  EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
            WHEN OTHERS THEN observed:=SQLSTATE;
  END;
  INSERT INTO wefrotas_qa_outcome VALUES('delete_titular','PT409',observed);

  observed:='OK';
  BEGIN
    DELETE FROM public.wefrotas_drivers
      WHERE organization_id='00000000-0000-4000-8000-000000000042' AND entity_id='driver1';
    RAISE EXCEPTION 'rollback successful test' USING ERRCODE='PZ900';
  EXCEPTION WHEN SQLSTATE 'PZ900' THEN NULL;
            WHEN OTHERS THEN observed:=SQLSTATE;
  END;
  INSERT INTO wefrotas_qa_outcome VALUES('delete_driver','PT409',observed);

  IF EXISTS(SELECT 1 FROM wefrotas_qa_outcome WHERE expected IS DISTINCT FROM actual) THEN
    RAISE EXCEPTION 'WeFrotas reserve regression failed: %',
      (SELECT jsonb_agg(to_jsonb(t)) FROM wefrotas_qa_outcome t WHERE expected IS DISTINCT FROM actual);
  END IF;
END;
$reserve_sql_qa$;
SELECT scenario,expected,actual FROM wefrotas_qa_outcome ORDER BY scenario;
ROLLBACK;
