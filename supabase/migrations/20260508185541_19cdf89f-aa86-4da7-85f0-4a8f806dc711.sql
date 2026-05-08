
CREATE TYPE public.app_role_tipo AS ENUM ('admin', 'editor', 'lector');

CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  rol public.app_role_tipo NOT NULL DEFAULT 'lector',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read app_users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "public write app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed admin/admin (bcrypt hash de "admin", cost 10)
INSERT INTO public.app_users (usuario, nombre, password_hash, rol, activo)
VALUES ('admin', 'Administrador', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', true);
