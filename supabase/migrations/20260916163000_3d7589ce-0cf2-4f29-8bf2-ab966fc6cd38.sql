DROP POLICY IF EXISTS purchases_ins ON public.purchases;
CREATE POLICY purchases_ins ON public.purchases FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'accounts') OR public.can_write(auth.uid(),'scan'));
DROP POLICY IF EXISTS shipments_ins ON public.shipments;
CREATE POLICY shipments_ins ON public.shipments FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'shipments') OR public.can_write(auth.uid(),'scan'));
DROP POLICY IF EXISTS stock_movements_ins ON public.stock_movements;
CREATE POLICY stock_movements_ins ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid(),'store') OR public.can_write(auth.uid(),'scan'));