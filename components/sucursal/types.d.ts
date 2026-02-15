export interface IUsuario {
    id: string;
    email: string;
    nombre: string;
    rol: number;
}

export interface IPaciente {
    id?: string;
    nombres: string;
    apellidos: string;
    genero: string;
    rut: string;
    nombre_social?: string | null;
    nuevo: boolean;
    trato_especial?: boolean;
}

export interface IProfesional {
    id: string;
    usuario_id: IUsuario;
}

export interface IBox {
    id: string;
    numero: number;
    paciente_id: IPaciente;
    profesional_id: IProfesional;
    ocupado: boolean;
    inicio_atencion?: Date | null;
    termino_atencion?: Date | null;    
}

export interface IArribo {
    id: string;
    paciente_id: IPaciente;
    fecha_atencion: Date | null;
    fecha_termino: Date | null;
}