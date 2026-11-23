export class TicketNotFoundError extends Error {
  constructor() {
    super('La entrada no existe o no pertenece al usuario.');
  }
}

export class TicketCodeNotFoundError extends Error {
  constructor() {
    super('El código de entrada no existe.');
  }
}

export class TicketBatchConflictError extends Error {
  constructor() {
    super('La orden ya emitió una cantidad o referencias diferentes.');
  }
}

export class TicketBatchAlreadyExistsError extends Error {
  constructor() {
    super('La orden ya tiene entradas emitidas.');
  }
}

export class TicketFileUnavailableError extends Error {
  constructor() {
    super('El archivo PDF de la entrada no está disponible.');
  }
}

export class TicketDependencyError extends Error {
  constructor(dependency: string) {
    super(`No se pudo obtener información desde ${dependency}.`);
  }
}
