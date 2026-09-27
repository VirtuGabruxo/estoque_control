ALTER TABLE public.lancamentos_fiado
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'compra'
    CHECK (tipo IN ('compra', 'pagamento'));

ALTER TABLE public.lancamentos_fiado
  ADD COLUMN IF NOT EXISTS nome_comprador TEXT;

CREATE INDEX IF NOT EXISTS idx_lancamentos_fiado_tipo
  ON public.lancamentos_fiado (cliente_id, tipo);

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lancamentos_fiado'
  AND column_name IN ('tipo', 'nome_comprador');
