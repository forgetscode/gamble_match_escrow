



declare module "sqlite-async" {
    import { RunResult } from "sqlite3";
    export default class Database {
        static get OPEN_READONLY(): number;
        static get OPEN_READWRITE(): number;
        static get OPEN_CREATE(): number;
        static get SQLITE3_VERSION(): any;
        static open(filename: string, mode?: number): Promise<Database>;
        open(filename: string, mode?: number): Promise<Database>;
        db: sqlite.Database;
        filename: string;
        close(fn?: any): any;
        run(...args: any[]): Promise<RunResult>;
        get(...args: any[]): Promise<RunResult>;
        all(...args: any[]): Promise<any[]>;
        each(...args: any[]): Promise<any>;
        exec(sql: string): Promise<any>;
        transaction(fn: any): Promise<any>;
        prepare(...args: any[]): Promise<any>;
    }
    import sqlite = require("sqlite3");
}
