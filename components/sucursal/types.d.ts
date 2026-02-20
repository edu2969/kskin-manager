export interface IUsuario {
    id: string;
    email: string;
    nombre: string;
    rol: number;
}

export interface ISitemaSalud {
    nombre: string;
    codigoIso: string;
}

export interface IPaciente {
    id?: string;
    nombres: string;
    apellidos: string;
    direccion: string;
    telefono: string;
    sistemaSalud: ISitemaSalud;
    genero: string;
    numeroIdentidad: string;
    nombreSocial?: string | null;
    nuevo: boolean;
    tratoEspecial?: boolean;
    fechaNacimiento: Date | null;
    email: string;
    alergias?: string;
}

export interface IProfesional {
    id: string;
    usuarioId: IUsuario;
    especialidades: string[];
}

export interface IBox {
    id: string;
    numero: number;
    pacienteId: IPaciente;
    profesionalId: IProfesional;
    ocupado: boolean;
    inicioAtencion?: Date | null;
    terminoAtencion?: Date | null;    
}

export interface IArribo {
    id: string;
    pacienteId: IPaciente;
    fechaAtencion: Date | null;
    fechaTermino: Date | null;
}

export interface IParto {
    id: string;
    tipo: 'normal' | 'cesarea';
    fecha: Date;
    genero: string;
    abortado: boolean;
}

export interface IHigiene {    
    cantidadCigarrillosSemanales: number,
    cantidadAguaDiariaLitros: number,
    horasEjercicioSemanales: number,
    nivelEstres: 'bajo' | 'medio' | 'alto',
    calidadDormir: 'buena' | 'regular' | 'mala',
    habitoAlimenticio: string;
}