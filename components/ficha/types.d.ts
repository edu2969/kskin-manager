export interface IPartoForm {
    partoId: string | null;
    pacienteId?: string;
    fecha: string;
    genero: string;
    tipo: string;
}

export interface IAnticonceptivoForm {
    anticonceptivoId: string | number | null;
    pacienteId?: string;
    metodoAnticonceptivoId: number;
    fechaDesde: string | null;
    fechaHasta: string | null;
}

export interface IHigieneForm {
    cantidadCigarrillosSemanales: number;
    aguaConsumidaDiariaLitros: number;
    horasEjercicioSemanales: number;
    nivelEstres: "bajo" | "medio" | "alto" | "";
    calidadDormir: "buena" | "regular" | "mala" | "";
    habitoAlimenticio: string;
}

export interface IFichaForm {
    anamnesis: string;
    receta: string;
    tratamiento: string;
    examenes: string;
    paciente: {
        nombres: string;
        apellidos: string;
        numeroIdentidad: string;
        genero: string;
        sistemaSaludId: number;
        telefono: string;
        email: string;
        direccion: string;
        fechaNacimiento: string;
        alergias: string;
        medicamentos: string;
        operaciones: string,
        otroAnticonceptivo: string;
        otroMedicamento: string;
        otroAntecedente: string;
    };
    metodosAnticonceptivos: IAnticonceptivoForm[];
    medicamentos: string[];
    antecedentes: string[];
    partos: IPartoForm[];
    higiene: IHigieneForm;
}