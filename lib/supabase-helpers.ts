import { NextResponse } from "next/server";

export class APIResponse {
  static success(data: unknown, message?: string) {
    return NextResponse.json({
      ok: true,
      data,
      message
    });
  }

  static error(error: string, status = 400, details?: unknown) {
    return NextResponse.json({
      ok: false,
      error,
      details
    }, { status });
  }

  static unauthorized(error = 'No autorizado') {
    return NextResponse.json({
      ok: false,
      error
    }, { status: 401 });
  }

  static notFound(error = 'Recurso no encontrado') {
    return NextResponse.json({
      ok: false,
      error
    }, { status: 404 });
  }
}