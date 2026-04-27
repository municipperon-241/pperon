
-- Enums
CREATE TYPE public.estado_expediente AS ENUM ('Pendiente', 'Demorado', 'Archivado', 'Finalizado');
CREATE TYPE public.tipo_movimiento AS ENUM ('Normal', 'Reapertura');

-- Oficinas
CREATE TABLE public.oficinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expedientes
CREATE TABLE public.expedientes (
  codexp TEXT PRIMARY KEY,
  codigo INTEGER NOT NULL,
  anoexp INTEGER NOT NULL,
  nroexp INTEGER NOT NULL,
  letraexp TEXT NOT NULL,
  apeynom TEXT NOT NULL,
  fechent DATE NOT NULL,
  estado public.estado_expediente NOT NULL DEFAULT 'Pendiente',
  organismo TEXT NOT NULL,
  tema TEXT NOT NULL,
  iniciado_por TEXT,
  iniciado_nro TEXT,
  tipo_objeto TEXT,
  nro_objeto TEXT,
  nro_acta TEXT,
  infraccion TEXT,
  oficina_inicio_id UUID REFERENCES public.oficinas(id) ON DELETE SET NULL,
  nro_juzgado TEXT,
  comentario TEXT,
  ultima_nota TEXT,
  exp_anexados TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE (codigo, anoexp, nroexp, letraexp)
);

CREATE INDEX idx_expedientes_estado ON public.expedientes(estado);
CREATE INDEX idx_expedientes_apeynom ON public.expedientes USING GIN (to_tsvector('spanish', apeynom));

-- Movimientos
CREATE TABLE public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codexp TEXT NOT NULL REFERENCES public.expedientes(codexp) ON DELETE CASCADE,
  nromov INTEGER NOT NULL,
  oficina_id UUID NOT NULL REFERENCES public.oficinas(id),
  fechaini TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecsarea TIMESTAMPTZ,
  estado_resultante public.estado_expediente NOT NULL,
  tipo_movimiento public.tipo_movimiento NOT NULL DEFAULT 'Normal',
  observac TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  UNIQUE (codexp, nromov)
);

CREATE INDEX idx_movimientos_codexp ON public.movimientos(codexp);

-- Configuracion (single row)
CREATE TABLE public.configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,
  municipalidad TEXT NOT NULL DEFAULT 'MUNICIPALIDAD',
  direccion TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.configuracion (id, municipalidad) VALUES (1, 'MUNICIPALIDAD DE PTE. PERON');

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_expedientes_updated_at
  BEFORE UPDATE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_configuracion_updated_at
  BEFORE UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: asignar nromov incremental + cerrar movimiento anterior + actualizar estado expediente
CREATE OR REPLACE FUNCTION public.handle_nuevo_movimiento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_estado_actual public.estado_expediente;
  v_max_nromov INTEGER;
BEGIN
  -- Validar expediente
  SELECT estado INTO v_estado_actual FROM public.expedientes WHERE codexp = NEW.codexp;
  IF v_estado_actual IS NULL THEN
    RAISE EXCEPTION 'Expediente % no existe', NEW.codexp;
  END IF;

  -- Si está Finalizado, solo permitir Reapertura
  IF v_estado_actual = 'Finalizado' AND NEW.tipo_movimiento <> 'Reapertura' THEN
    RAISE EXCEPTION 'El expediente está Finalizado. Solo se permite un movimiento de tipo Reapertura.';
  END IF;

  -- Asignar nromov si no viene
  IF NEW.nromov IS NULL OR NEW.nromov = 0 THEN
    SELECT COALESCE(MAX(nromov), 0) + 1 INTO v_max_nromov
      FROM public.movimientos WHERE codexp = NEW.codexp;
    NEW.nromov := v_max_nromov;
  END IF;

  -- Cerrar movimiento anterior abierto
  UPDATE public.movimientos
    SET fecsarea = NEW.fechaini
    WHERE codexp = NEW.codexp AND fecsarea IS NULL AND nromov < NEW.nromov;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_nuevo_movimiento
  BEFORE INSERT ON public.movimientos
  FOR EACH ROW EXECUTE FUNCTION public.handle_nuevo_movimiento();

-- Trigger: actualizar estado del expediente luego del movimiento
CREATE OR REPLACE FUNCTION public.sync_estado_expediente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.expedientes
    SET estado = NEW.estado_resultante,
        updated_by = NEW.created_by
    WHERE codexp = NEW.codexp;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_estado_expediente
  AFTER INSERT ON public.movimientos
  FOR EACH ROW EXECUTE FUNCTION public.sync_estado_expediente();

-- Sembrar oficinas comunes
INSERT INTO public.oficinas (nombre) VALUES
  ('Mesa de Entradas'),
  ('Intendencia'),
  ('Secretaría de Gobierno'),
  ('Escribanía General'),
  ('Asesoría Legal');

-- RLS: acceso público (sin auth) para esta app
ALTER TABLE public.oficinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read oficinas" ON public.oficinas FOR SELECT USING (true);
CREATE POLICY "public write oficinas" ON public.oficinas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read expedientes" ON public.expedientes FOR SELECT USING (true);
CREATE POLICY "public write expedientes" ON public.expedientes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read movimientos" ON public.movimientos FOR SELECT USING (true);
CREATE POLICY "public write movimientos" ON public.movimientos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read configuracion" ON public.configuracion FOR SELECT USING (true);
CREATE POLICY "public write configuracion" ON public.configuracion FOR ALL USING (true) WITH CHECK (true);
