import { StaticCodeAnalyzer, Transformers } from '@moneyforward/sca-action-core';
interface Error {
    message: string;
    backtrace: string[];
}
interface Issue {
    rule: {
        id: string;
        messages: string[];
    };
    script: string;
    justifications: string[];
    examples: {
        before?: string;
        after?: string;
    }[];
    location: {
        start: [number, number];
        end: [number, number];
    };
}
export interface Result {
    issues: Issue[];
    errors: {
        path: string;
        error: Error;
    }[];
}
export interface FatalError {
    fatal_error: Error;
}
export interface ConfigErrors {
    config_errors: {
        path: string;
        error: Error;
    }[];
}
export default class Analyzer extends StaticCodeAnalyzer {
    private static readonly command;
    constructor(options?: string[]);
    protected prepare(): Promise<unknown>;
    protected createTransformStreams(): Transformers;
}
export {};
