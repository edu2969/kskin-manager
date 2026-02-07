export interface IPaciente {
    _id?: string;
    nombres: string;
    apellidos: string;
    genero: string;
    rut: string;
    nombreSocial?: string | null;
    nuevo: boolean;
    tratoEspecial?: boolean;
}

export interface IProfesional {
    _id: string;
    name: string;
    email: string;
}

export interface IBox {
    _id: string;
    nombre: string;
    numero: number;
    horas: number;
    minutos: number;
    ocupado: boolean;
    pacienteId: IPaciente;
    profesionalId: IProfesional;
    inicioAtencion?: Date | null;
    terminoAtencion?: Date | null;
    ocupacion?: {
        tiempoEstimado: number; // en minutos
    } | null;
    progreso?: number; // 0 a 1 para barra de progreso
}

export interface IArribo {
    _id: string;
    pacienteId: IPaciente;
    fechaLlegada: string;
    profesionalId: string | null;
}