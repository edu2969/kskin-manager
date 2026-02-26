CREATE TYPE nivel_estres AS ENUM ('bajo', 'medio', 'alto');
CREATE TYPE calidad_dormir AS ENUM ('buena', 'regular', 'mala');
CREATE TYPE tipo_parto AS ENUM ('normal', 'cesarea');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre TEXT NOT NULL,
    rol NUMERIC NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profesionales table
CREATE TABLE profesionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Especialidades table
CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sistemas de Salud table
CREATE TABLE sistemas_salud (
    id SMALLINT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profesional Especialidades junction table
CREATE TABLE profesional_especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profesional_id UUID NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    especialidad_id UUID NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profesional_id, especialidad_id)
);

-- Pacientes table
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    numero_identidad VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    fecha_nacimiento DATE,
    genero VARCHAR(20),
    nombre_social VARCHAR(64),
    grupo_sanguineo VARCHAR(10),
    direccion TEXT,
    telefono VARCHAR(20),
    sistema_salud_id SMALLINT REFERENCES sistemas_salud(id),
    alergias TEXT,
    operaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fichas table
CREATE TABLE fichas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    profesional_id UUID NOT NULL REFERENCES profesionales(id),
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    tratamiento TEXT,
    duracion_tratamiento_semanas SMALLINT,
    examenes TEXT,
    antecedentes_adicionales TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP DEFAULT NULL
);

-- Antecedentes table
CREATE TABLE antecedentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),        
    nombre TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paciente Antecedentes junction table
CREATE TABLE paciente_antecedentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    antecedente_id UUID NOT NULL REFERENCES antecedentes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(paciente_id, antecedente_id)
);

CREATE TABLE paciente_partos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha DATE,
    tipo tipo_parto,
    abortado BOOLEAN DEFAULT false,
    genero VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ficha_higiene (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    cantidad_cigarrillos_semanales NUMERIC DEFAULT 0,
    agua_consumida_diaria_litros NUMERIC DEFAULT 0,
    horas_ejercicio_semanales NUMERIC DEFAULT 0,
    nivel_estres nivel_estres DEFAULT 'medio',
    calidad_dormir calidad_dormir DEFAULT 'regular',
    habito_alimenticio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Medicamentos table
CREATE TABLE medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ficha Medicamentos junction table
CREATE TABLE ficha_medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ficha_id UUID NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    dosis_prescrita VARCHAR(100),
    frecuencia VARCHAR(100),
    duracion VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ficha_id, medicamento_id)
);

CREATE TABLE metodos_anticonceptivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metodos Anticonceptivos table
CREATE TABLE paciente_metodos_anticonceptivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Examenes table
CREATE TABLE ficha_examenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT NOT NULL    
);

-- Arribox table
CREATE TABLE arribos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha_atencion TIMESTAMP DEFAULT NULL,
    fecha_termino TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boxes (Consultorios) table
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INT NOT NULL UNIQUE,
    ocupado BOOLEAN DEFAULT false,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    profesional_id UUID REFERENCES profesionales(id) ON DELETE SET NULL,
    inicio_atencion TIMESTAMP NULL,
    termino_atencion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_fichas_paciente ON fichas(paciente_id);
CREATE INDEX idx_fichas_profesional ON fichas(profesional_id);
CREATE INDEX idx_antecedentes_paciente ON antecedentes_morbidos(paciente_id);
CREATE INDEX idx_metodos_paciente ON metodos_anticonceptivos(paciente_id);
CREATE INDEX idx_examenes_ficha ON examenes(ficha_id);
CREATE INDEX idx_arribos_paciente ON arribos(paciente_id);
CREATE INDEX idx_arribos_estado ON arribos(estado);
CREATE INDEX idx_profesional_especialidades ON profesional_especialidades(profesional_id);
CREATE INDEX idx_pacientes_identidad ON pacientes(numero_identidad);CREATE INDEX idx_boxes_numero ON boxes(numero);
CREATE INDEX idx_boxes_paciente ON boxes(paciente_id);
CREATE INDEX idx_boxes_profesional ON boxes(profesional_id);


