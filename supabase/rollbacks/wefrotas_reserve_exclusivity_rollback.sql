-- WeFrotas: rollback emergencial APENAS da proteção do carro reserva.
-- Usar somente após reverter o frontend do módulo, em janela controlada.
-- Remove funções e triggers, sem alterar ou apagar dados de veículos/financeiro.
BEGIN;
DROP TRIGGER IF EXISTS wefrotas_reserve_vehicle_delete_guard ON public.wefrotas_vehicles;
DROP TRIGGER IF EXISTS wefrotas_reserve_driver_delete_guard ON public.wefrotas_drivers;
DROP TRIGGER IF EXISTS wefrotas_reserve_exclusivity ON public.wefrotas_vehicles;
DROP FUNCTION IF EXISTS public.wefrotas_prevent_reserve_reference_delete();
DROP FUNCTION IF EXISTS public.wefrotas_assert_reserve_exclusivity();
COMMIT;
