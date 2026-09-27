-- ============================================================
-- Migration: adicionar colunas nome_comprador e tipo
-- em lancamentos_fiado para suporte a pagamentos e
-- identificação do comprador
-- ============================================================
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azeebasbdzsrjobmevjp/sql/new
-- ============================================================

-- 1. Adiciona coluna tipo (compra | pagamento) com default 'compra'
ALTER TABLE public.lancamentos_fiado
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'compra'
    CHECK (tipo IN ('compra', 'pagamento'));

-- 2. Adiciona coluna nome_comprador (nullable)
ALTER TABLE public.lancamentos_fiado
  ADD COLUMN IF NOT EXISTS nome_comprador TEXT;

-- 3. Atualiza registros existentes para garantir tipo correto
UPDATE public.lancamentos_fiado SET tipo = 'compra' WHERE tipo IS NULL;

-- 4. (Opcional) Índice para filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_lancamentos_fiado_tipo
  ON public.lancamentos_fiado (cliente_id, tipo);
