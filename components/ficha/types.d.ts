export interface IParto {
    numero: number;
    fecha: string;
    genero: string;
    tipo: string;
}

export interface IHigieneForm {
    cantidadCigarrillosSemanales: number;
    aguaConsumidaDiariaLitros: number;
    horasEjerciciosSemanales: number;
    nivelEstres: "bajo" | "medio" | "alto" | "";
    calidadDormir: "buena" | "regular" | "mala" | "";
    habitoAlimenticio: string;
}

export interface IFichaForm {
    anamnesis: string;
    indicaciones: string;
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
        otroAnticonceptivo: string;
        otroMedicamento: string;
        otroAntecedente: string;
    };
    metodosAnticonceptivos: string[];
    medicamentos: string[];
    antecedentes: string[];
    partos: IParto[];
    higiene: IHigieneForm;
}