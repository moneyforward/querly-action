import { expect } from 'chai';
import stream from 'stream';
import Analyzer, { Result } from '../src'
import { AssertionError } from 'assert';

describe('Transform', () => {
  it('should return the problem object', async () => {
    const expected = {
      file: 'foo/bar.rb',
      line: 1,
      column: 2,
      severity: 'warning',
      message: `hello, world!`,
      code: 'rule1'
    };
    const result: Result = {
      issues: [
        {
          rule: {
            id: 'rule1',
            messages: ['hello, world!']
          },
          location: {
            start: [1, 2],
            end: [3, 4]
          },
          script: 'foo/bar.rb',
          justifications: [],
          examples: []
        }
      ],
      errors: []
    };
    const text = JSON.stringify(result);
    const analyzer = new (class extends Analyzer {
      public constructor() {
        super();
      }
      public createTransformStreams(): stream.Transform[] {
        return super.createTransformStreams();
      }
    })();
    const transform = analyzer.createTransformStreams()
      .reduce((previous, current) => previous.pipe(current), stream.Readable.from(text));
    for await (const problem of transform) return expect(problem).to.deep.equal(expected);
    throw new AssertionError({ message: 'There was no problem to expect.', expected });
  });
});
