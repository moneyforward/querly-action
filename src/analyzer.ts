import stream from 'stream';
import util from 'util';
import { StaticCodeAnalyzer, Transformers, tool } from '@moneyforward/sca-action-core';

const debug = util.debuglog('querly-action');

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
  private static readonly command = 'querly';

  constructor(options: string[] = []) {
    super(Analyzer.command, options.concat(['check', '--format=json']), undefined, undefined, undefined, 'Querly');
  }

  protected async prepare(): Promise<unknown> {
    return tool.installGem(true, Analyzer.command);
  }

  protected createTransformStreams(): Transformers {
    const buffers: Buffer[] = [];
    const transformers = [
      new stream.Transform({
        readableObjectMode: true,
        transform: function (buffer, _encoding, done): void {
          buffers.push(buffer);
          done();
        },
        flush: function (done): void {
          const result = JSON.parse(Buffer.concat(buffers).toString());

          if (((result): result is FatalError => result.fatal_error)(result)) {
            return done(null, {
              severity: 'error',
              message: result.fatal_error.message
            });
          }

          if (((result): result is ConfigErrors => result.config_errors)(result)) {
            for (const configError of result.config_errors) this.push({
              file: configError.path,
              severity: 'error',
              message: configError.error.message
            });
            this.push(null);
            return done();
          }

          if (((result): result is Result => result.issues && result.errors)(result)) {
            debug(`Detected %d problem(s).`, result.issues.length);
            for (const issue of result.issues) this.push({
              file: issue.script,
              line: issue.location.start[0],
              column: issue.location.start[1],
              severity: 'warning',
              message: issue.rule.messages.join(' '),
              code: issue.rule.id
            });
            for (const error of result.errors) this.push({
              file: error.path,
              severity: 'error',
              message: error.error.message
            });
            this.push(null);
            return done();
          }

          return done(new TypeError());
        }
      })
    ];
    transformers.reduce((prev, next) => prev.pipe(next));
    return [transformers[0], transformers[transformers.length - 1]];
  }
}
