declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export class StatementSync {
    run(...params: any[]): { changes: number; lastInsertRowid: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }
}
