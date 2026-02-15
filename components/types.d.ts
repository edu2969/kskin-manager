export interface IFichaHistorica {
    fichaId: string;
    fecha: Date;
    nombreProfesional: string;
    especialidades: string[];
    alias: string;
    tratamiento: string | null;
}

export interface IFichaDetalle {
    id: string,
    paciente: {
        id: string,
        nombres: string,
        apellidos: string,
        numeroIdentidad: string,
        fechaNacimiento: Date,
        genero: string,
        sistemaSalud: string,
        aplicaAlergias: boolean,
        alergias: string,
        antecedentes: string[],
        medicamentos: {
            nombre: string,
            unidades: string,
            frecuencia: string
        }[],
        partos: {
            fecha: Date,
            tipo: 'normal' | 'cesarea',
            abortado: boolean
            genero: string;
        }[],
        higiene: {
            cantidadCigarrillosSemanales: number;
            aguaConsumidaDiariaLitros: number;
            nivelEstres: 'bajo' | 'medio' | 'alto';
            calidadDormir: 'buena' | 'regular' | 'mala';
            horasEjerciciosSemanales: number;
            habitoAlimenticio: string;
        },
        antecedentesAdicionales: string | null;
    },
    profesional: {
        id: string,
        nombre: string,
        email: string,
        especialidades: [{
            nombre: string
        }]
    },
    fecha: Date,
    tratamiento: string,
    duracionTratamientoSemanas: number,
    examenes: string,
    createdAt: Date,
    finishedAt: Date
}