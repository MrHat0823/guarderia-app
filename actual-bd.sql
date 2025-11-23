-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.acudientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'CC'::text,
  numero_documento text NOT NULL UNIQUE,
  telefono1 text,
  telefono2 text,
  email text,
  direccion text,
  created_at timestamp with time zone DEFAULT now(),
  guarderia_id uuid NOT NULL,
  CONSTRAINT acudientes_pkey PRIMARY KEY (id),
  CONSTRAINT acudientes_guarderia_id_fkey FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id)
);
CREATE TABLE public.aulas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_aula text NOT NULL,
  nivel_educativo text NOT NULL,
  numero_aula text NOT NULL,
  capacidad integer NOT NULL DEFAULT 20,
  profesor_asignado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  guarderia_id uuid,
  CONSTRAINT aulas_pkey PRIMARY KEY (id),
  CONSTRAINT aulas_profesor_asignado_id_fkey FOREIGN KEY (profesor_asignado_id) REFERENCES public.users(id),
  CONSTRAINT aulas_guarderia_id_fkey FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id)
);
CREATE TABLE public.configuracion_guarderia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_guarderia text NOT NULL DEFAULT 'Guardería Infantil'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  telefono_guarderia text,
  direccion_guarderia text,
  CONSTRAINT configuracion_guarderia_pkey PRIMARY KEY (id)
);
CREATE TABLE public.guarderias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text,
  telefono text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guarderias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nino_acudiente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nino_id uuid NOT NULL,
  acudiente_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  parentesco USER-DEFINED DEFAULT 'Madre'::tipo_parentesco,
  CONSTRAINT nino_acudiente_pkey PRIMARY KEY (id),
  CONSTRAINT nino_acudiente_nino_id_fkey FOREIGN KEY (nino_id) REFERENCES public.ninos(id),
  CONSTRAINT nino_acudiente_acudiente_id_fkey FOREIGN KEY (acudiente_id) REFERENCES public.acudientes(id)
);
CREATE TABLE public.ninos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'TI'::text,
  numero_documento text NOT NULL UNIQUE,
  fecha_nacimiento date,
  aula_id uuid,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  guarderia_id uuid NOT NULL,
  CONSTRAINT ninos_pkey PRIMARY KEY (id),
  CONSTRAINT ninos_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id),
  CONSTRAINT ninos_guarderia_id_fkey FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id)
);
CREATE TABLE public.registros_asistencia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora time without time zone NOT NULL DEFAULT CURRENT_TIME(0),
  tipo USER-DEFINED NOT NULL,
  nino_id uuid NOT NULL,
  acudiente_id uuid,
  usuario_registra_id uuid NOT NULL,
  anotacion text,
  created_at timestamp with time zone DEFAULT now(),
  guarderia_id uuid,
  aula_id uuid,
  tercero_id uuid,
  -- Campos de observaciones para entrada
  fiebre boolean NOT NULL DEFAULT false,
  mordidas boolean NOT NULL DEFAULT false,
  aruñado boolean NOT NULL DEFAULT false,
  golpes boolean NOT NULL DEFAULT false,
  otro boolean NOT NULL DEFAULT false,
  otro_texto text,
  -- Campos de observaciones para salida
  fiebre_salida boolean NOT NULL DEFAULT false,
  mordidas_salida boolean NOT NULL DEFAULT false,
  aruñado_salida boolean NOT NULL DEFAULT false,
  golpes_salida boolean NOT NULL DEFAULT false,
  CONSTRAINT registros_asistencia_pkey PRIMARY KEY (id),
  CONSTRAINT registros_asistencia_nino_id_fkey FOREIGN KEY (nino_id) REFERENCES public.ninos(id),
  CONSTRAINT registros_asistencia_acudiente_id_fkey FOREIGN KEY (acudiente_id) REFERENCES public.acudientes(id),
  CONSTRAINT registros_asistencia_usuario_registra_id_fkey FOREIGN KEY (usuario_registra_id) REFERENCES public.users(id),
  CONSTRAINT fk_guarderia_id FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id),
  CONSTRAINT registros_asistencia_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id),
  CONSTRAINT registros_asistencia_tercero_id_fkey FOREIGN KEY (tercero_id) REFERENCES public.terceros(id)
);
CREATE TABLE public.terceros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  telefono text,
  email text,
  direccion text,
  parentesco text,
  foto_id_frente text,
  foto_id_reverso text,
  created_at timestamp with time zone DEFAULT now(),
  guarderia_id uuid NOT NULL,
  aula_id uuid,
  CONSTRAINT terceros_pkey PRIMARY KEY (id),
  CONSTRAINT terceros_guarderia_id_fkey FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id),
  CONSTRAINT terceros_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  rol USER-DEFINED NOT NULL DEFAULT 'profesor'::user_role,
  tipo_documento text NOT NULL DEFAULT 'CC'::text,
  numero_documento text NOT NULL UNIQUE,
  telefono text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password text NOT NULL DEFAULT '123456'::text,
  guarderia_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_guarderia_id_fkey FOREIGN KEY (guarderia_id) REFERENCES public.guarderias(id)
);