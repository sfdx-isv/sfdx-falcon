import { test } from '@salesforce/command/lib/test';
//import { ensureJsonMap, ensureString } from '@salesforce/ts-types';

export enum KEY {
  DOWN  = '\x1B\x5B\x42',
  UP    = '\x1B\x5B\x41',
  ENTER = '\x0D',
  SPACE = '\x20'
}

describe('falcon:adk:create', () => {


});




/*
describe('falcon:adk:create', () => {
  test
//    .stdin(KEY.ENTER, 30000)
//    .stdin(KEY.ENTER, 34000)
//    .stdin(KEY.ENTER, 38000)
    .stdout({print: true})
    .timeout(2000000)
    .do(() => console.log('foo'))
//    .do(({stdout}) => expect(stdout).to.equal('foo\n'))
//    .it('does something with context', ctx => {
//      expect(ctx.stdout).to.equal('foos\n');
//    });
    .command(['falcon:adk:create'])
    .do(() => console.log('foo22222222'))
    .it('runs falcon:adk:create', ctx => {
      //console.log(ctx.stdout);
//      expect(ctx.stdout).to.contain('Initialization Complete', 'HORROR! No Inclusion!');
    });
});
*/
