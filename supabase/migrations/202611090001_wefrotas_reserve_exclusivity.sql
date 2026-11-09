-- WeFrotas — vehicle reserve exclusivity, transaction-safe and tenant-scoped.
-- The constraint fires at the end of a transaction, so an atomic multi-vehicle
-- update is checked against its final state, not intermediate write order.
-- A per-organization workspace-state row lock serializes concurrent writers.
CREATE OR REPLACE FUNCTION public.wefrotas_assert_reserve_exclusivity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $reserve_guard$
DECLARE
  slot record;
  start_on date;
  end_on date;
  start_km numeric;
  end_km numeric;
  overlap_a text;
  overlap_b text;
BEGIN
  -- Most normal vehicle saves do not change substitutions.
  IF TG_OP = 'UPDATE' AND
     NEW.data->'vehicleSubstitutions' IS NOT DISTINCT FROM OLD.data->'vehicleSubstitutions' THEN
    RETURN NULL;
  END IF;
  IF NOT (NEW.data ? 'vehicleSubstitutions') THEN
    RETURN NULL;
  END IF;
  IF jsonb_typeof(NEW.data->'vehicleSubstitutions') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: substitutions must be an array'
      USING ERRCODE = '22023';
  END IF;

  -- The snapshot RPC already holds this same lock; independent privileged
  -- writes must acquire it too. Only one transaction can validate this tenant
  -- at once under the database's READ COMMITTED isolation.
  PERFORM 1 FROM public.wefrotas_workspace_state
   WHERE organization_id = NEW.organization_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: workspace unavailable'
      USING ERRCODE = '22023';
  END IF;

  FOR slot IN
    SELECT v.entity_id AS source_id, e.item
      FROM public.wefrotas_vehicles AS v
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(v.data->'vehicleSubstitutions') = 'array'
          THEN v.data->'vehicleSubstitutions' ELSE '[]'::jsonb END
      ) AS e(item)
     WHERE v.organization_id = NEW.organization_id
  LOOP
    IF jsonb_typeof(slot.item) IS DISTINCT FROM 'object'
       OR nullif(slot.item->>'id', '') IS NULL
       OR nullif(slot.item->>'reserveVehicleId', '') IS NULL
       OR nullif(slot.item->>'driverId', '') IS NULL
       OR slot.item->>'sourceVehicleId' IS DISTINCT FROM slot.source_id
       OR slot.source_id = slot.item->>'reserveVehicleId'
       OR coalesce(slot.item->>'reason', '') NOT IN ('manutencao','sinistro','outro') THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: invalid vehicle, driver or event'
        USING ERRCODE = '22023';
    END IF;
    IF coalesce(slot.item->>'startDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
       OR (coalesce(slot.item->>'endDate','') <> ''
         AND slot.item->>'endDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: invalid dates'
        USING ERRCODE = '22007';
    END IF;
    BEGIN
      start_on := (slot.item->>'startDate')::date;
      end_on := nullif(slot.item->>'endDate','')::date;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: calendar date does not exist'
        USING ERRCODE = '22007';
    END;
    IF end_on < start_on THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: return precedes delivery'
        USING ERRCODE = '22023';
    END IF;
    IF coalesce(slot.item->>'startKm','') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: delivery odometer missing'
        USING ERRCODE = '22023';
    END IF;
    start_km := (slot.item->>'startKm')::numeric;
    IF start_km > 9007199254740991 THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: delivery odometer out of range'
        USING ERRCODE = '22023';
    END IF;
    IF end_on IS NOT NULL THEN
      IF coalesce(slot.item->>'endKm','') !~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: return odometer missing'
          USING ERRCODE = '22023';
      END IF;
      end_km := (slot.item->>'endKm')::numeric;
      IF end_km < start_km OR end_km > 9007199254740991 THEN
        RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: return odometer out of range'
          USING ERRCODE = '22023';
      END IF;
    ELSIF coalesce(slot.item->>'endKm','') <> '' THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: return date missing'
        USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.wefrotas_vehicles AS v
       WHERE v.organization_id = NEW.organization_id
         AND v.entity_id = slot.item->>'reserveVehicleId'
    ) OR NOT EXISTS (
      SELECT 1 FROM public.wefrotas_drivers AS d
       WHERE d.organization_id = NEW.organization_id
         AND d.entity_id = slot.item->>'driverId'
    ) THEN
      RAISE EXCEPTION 'WEFROTAS_RESERVE_INVALID: reserve or driver not registered'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.wefrotas_vehicles AS v
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(v.data->'vehicleSubstitutions') = 'array'
        THEN v.data->'vehicleSubstitutions' ELSE '[]'::jsonb END
    ) AS e(item)
    WHERE v.organization_id = NEW.organization_id
    GROUP BY e.item->>'id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'WEFROTAS_RESERVE_CONFLICT: duplicate substitution identifier'
      USING ERRCODE = 'PT409';
  END IF;

  -- Check the complete final set, including a vehicle that is a titular in one
  -- event and a reserve in another. Inclusive dates match the browser rule.
  WITH slots AS (
    SELECT v.entity_id AS source_id, e.item->>'id' AS event_id,
           e.item->>'reserveVehicleId' AS reserve_id,
           e.item->>'driverId' AS driver_id,
           (e.item->>'startDate')::date AS started_at,
           nullif(e.item->>'endDate','')::date AS finished_at,
           e.ord
      FROM public.wefrotas_vehicles AS v
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(v.data->'vehicleSubstitutions') = 'array'
          THEN v.data->'vehicleSubstitutions' ELSE '[]'::jsonb END
      ) WITH ORDINALITY AS e(item,ord)
     WHERE v.organization_id = NEW.organization_id
  )
  SELECT a.event_id, b.event_id INTO overlap_a, overlap_b
  FROM slots AS a JOIN slots AS b
    ON (a.source_id, a.ord) < (b.source_id, b.ord)
  WHERE daterange(a.started_at,coalesce(a.finished_at,'infinity'::date),'[]') &&
        daterange(b.started_at,coalesce(b.finished_at,'infinity'::date),'[]')
    AND (a.source_id = b.source_id OR a.reserve_id = b.reserve_id
      OR a.source_id = b.reserve_id OR a.reserve_id = b.source_id
      OR a.driver_id = b.driver_id)
  LIMIT 1;
  IF overlap_a IS NOT NULL THEN
    RAISE EXCEPTION 'WEFROTAS_RESERVE_CONFLICT: overlapping substitutions % and %', overlap_a, overlap_b
      USING ERRCODE = 'PT409';
  END IF;

  RETURN NULL;
END;
$reserve_guard$;

-- Trigger functions are not an independently callable API.
REVOKE ALL ON FUNCTION public.wefrotas_assert_reserve_exclusivity()
  FROM PUBLIC, anon, authenticated;

CREATE CONSTRAINT TRIGGER wefrotas_reserve_exclusivity
  AFTER INSERT OR UPDATE OF data ON public.wefrotas_vehicles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.wefrotas_assert_reserve_exclusivity();


-- Never orphan a historical replacement by deleting a registered vehicle or
-- its driver. This applies to both current and finished substitutions.
CREATE OR REPLACE FUNCTION public.wefrotas_prevent_reserve_reference_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $reserve_delete_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.wefrotas_vehicles AS v
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(v.data->'vehicleSubstitutions') = 'array'
        THEN v.data->'vehicleSubstitutions' ELSE '[]'::jsonb END
    ) AS e(item)
    WHERE v.organization_id = OLD.organization_id
      AND (
        (TG_TABLE_NAME = 'wefrotas_vehicles'
          AND (v.entity_id = OLD.entity_id
            OR e.item->>'reserveVehicleId' = OLD.entity_id))
        OR (TG_TABLE_NAME = 'wefrotas_drivers'
          AND e.item->>'driverId' = OLD.entity_id)
      )
  ) THEN
    RAISE EXCEPTION 'WEFROTAS_RESERVE_CONFLICT: vehicle or driver has replacement history'
      USING ERRCODE = 'PT409';
  END IF;
  RETURN OLD;
END;
$reserve_delete_guard$;

REVOKE ALL ON FUNCTION public.wefrotas_prevent_reserve_reference_delete()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER wefrotas_reserve_vehicle_delete_guard
  BEFORE DELETE ON public.wefrotas_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.wefrotas_prevent_reserve_reference_delete();

CREATE TRIGGER wefrotas_reserve_driver_delete_guard
  BEFORE DELETE ON public.wefrotas_drivers
  FOR EACH ROW EXECUTE FUNCTION public.wefrotas_prevent_reserve_reference_delete();
