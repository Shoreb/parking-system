
-- =============================================
-- SISTEMA DE PARQUEADERO - SENA NODO TIC
-- Script SQL completo siguiendo MER exacto
-- =============================================

-- ROLES
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255)
);

-- USUARIOS (perfil del sistema de parqueadero, vinculado a auth)
CREATE TABLE public.usuarios (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  rol_id INT REFERENCES public.roles(id),
  activo SMALLINT DEFAULT 1,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TIPOS_VEHICULO
CREATE TABLE public.tipos_vehiculo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255)
);

-- ESPACIOS
CREATE TABLE public.espacios (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  tipo_vehiculo_id INT REFERENCES public.tipos_vehiculo(id),
  disponible SMALLINT DEFAULT 1
);

-- TARIFAS
CREATE TABLE public.tarifas (
  id SERIAL PRIMARY KEY,
  tipo_vehiculo_id INT REFERENCES public.tipos_vehiculo(id),
  nombre VARCHAR(100) NOT NULL,
  tipo_cobro VARCHAR(20) CHECK (tipo_cobro IN ('POR_MINUTO','POR_HORA','POR_DIA','FRACCION')),
  valor DECIMAL(10,2) NOT NULL,
  activo SMALLINT DEFAULT 1,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE
);

-- REGISTROS
CREATE TABLE public.registros (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  tipo_vehiculo_id INT REFERENCES public.tipos_vehiculo(id),
  espacio_id INT REFERENCES public.espacios(id),
  fecha_hora_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_hora_salida TIMESTAMP WITH TIME ZONE,
  minutos_totales INT,
  tarifa_id INT REFERENCES public.tarifas(id),
  valor_calculado DECIMAL(10,2),
  descuento_tipo VARCHAR(20) CHECK (descuento_tipo IN ('PORCENTUAL','FIJO','CORTESIA')),
  descuento_valor DECIMAL(10,2) DEFAULT 0,
  estado VARCHAR(10) DEFAULT 'EN_CURSO' CHECK (estado IN ('EN_CURSO','FINALIZADO')),
  usuario_entrada_id INT REFERENCES public.usuarios(id),
  usuario_salida_id INT REFERENCES public.usuarios(id)
);

-- TICKETS
CREATE TABLE public.tickets (
  id SERIAL PRIMARY KEY,
  registro_id INT REFERENCES public.registros(id) UNIQUE,
  codigo_ticket VARCHAR(50) UNIQUE NOT NULL,
  email_cliente VARCHAR(150),
  enviado_email SMALLINT DEFAULT 0,
  fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Función para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Función para verificar si es admin (rol_id = 1)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_user_id = auth.uid() AND rol_id = 1 AND activo = 1
  );
$$;

-- Función para verificar si es usuario activo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_user_id = auth.uid() AND activo = 1
  );
$$;

-- Políticas ROLES
CREATE POLICY "Usuarios activos pueden ver roles" ON public.roles FOR SELECT TO authenticated USING (public.is_active_user());

-- Políticas USUARIOS
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios FOR SELECT TO authenticated USING (auth_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin puede insertar usuarios" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin puede actualizar usuarios" ON public.usuarios FOR UPDATE TO authenticated USING (public.is_admin());

-- Políticas TIPOS_VEHICULO
CREATE POLICY "Usuarios activos ven tipos vehiculo" ON public.tipos_vehiculo FOR SELECT TO authenticated USING (public.is_active_user());
CREATE POLICY "Admin gestiona tipos vehiculo" ON public.tipos_vehiculo FOR ALL TO authenticated USING (public.is_admin());

-- Políticas ESPACIOS
CREATE POLICY "Usuarios activos ven espacios" ON public.espacios FOR SELECT TO authenticated USING (public.is_active_user());
CREATE POLICY "Usuarios activos actualizan espacios" ON public.espacios FOR UPDATE TO authenticated USING (public.is_active_user());

-- Políticas TARIFAS
CREATE POLICY "Usuarios activos ven tarifas" ON public.tarifas FOR SELECT TO authenticated USING (public.is_active_user());
CREATE POLICY "Admin gestiona tarifas" ON public.tarifas FOR ALL TO authenticated USING (public.is_admin());

-- Políticas REGISTROS
CREATE POLICY "Usuarios activos ven registros" ON public.registros FOR SELECT TO authenticated USING (public.is_active_user());
CREATE POLICY "Usuarios activos insertan registros" ON public.registros FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "Usuarios activos actualizan registros" ON public.registros FOR UPDATE TO authenticated USING (public.is_active_user());

-- Políticas TICKETS
CREATE POLICY "Usuarios activos ven tickets" ON public.tickets FOR SELECT TO authenticated USING (public.is_active_user());
CREATE POLICY "Usuarios activos insertan tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Roles
INSERT INTO public.roles (id, nombre, descripcion) VALUES
  (1, 'Administrador', 'Acceso total al sistema: usuarios, tarifas, reportes'),
  (2, 'Operario', 'Registro de entradas, salidas y consulta de cupos');

-- Tipos de vehículo
INSERT INTO public.tipos_vehiculo (id, nombre, descripcion) VALUES
  (1, 'Auto', 'Automóviles sedán y camionetas'),
  (2, 'Moto', 'Motocicletas de cualquier cilindraje');

-- Espacios: 30 autos (A01-A30) + 15 motos (M01-M15)
INSERT INTO public.espacios (codigo, tipo_vehiculo_id, disponible)
SELECT 'A' || LPAD(n::TEXT, 2, '0'), 1, 1 FROM generate_series(1, 30) AS n;

INSERT INTO public.espacios (codigo, tipo_vehiculo_id, disponible)
SELECT 'M' || LPAD(n::TEXT, 2, '0'), 2, 1 FROM generate_series(1, 15) AS n;

-- Tarifas iniciales
INSERT INTO public.tarifas (tipo_vehiculo_id, nombre, tipo_cobro, valor, activo, fecha_inicio) VALUES
  (1, 'Tarifa Auto por Hora', 'POR_HORA', 3000.00, 1, CURRENT_DATE),
  (1, 'Tarifa Auto por Minuto', 'POR_MINUTO', 60.00, 1, CURRENT_DATE),
  (2, 'Tarifa Moto por Hora', 'POR_HORA', 1500.00, 1, CURRENT_DATE),
  (2, 'Tarifa Moto por Minuto', 'POR_MINUTO', 30.00, 1, CURRENT_DATE);

-- Habilitar realtime para cupos en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.espacios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros;
