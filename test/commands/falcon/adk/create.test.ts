import { expect, test } from '@salesforce/command/lib/test';
//import { ensureJsonMap, ensureString } from '@salesforce/ts-types';

describe('falcon:adk:create', () => {
  test
    .stdout()
    .do(() => console.log('foo'))
    .do(({stdout}) => expect(stdout).to.equal('foo\n'))
    .it('does something with context', context => {
      // test code
    })    
//    .command(['falcon:adk:create'])
//    .it('runs hello:org22 --targetusername test@org.com', ctx => {
//      expect(ctx.stdout).to.contain('Initialization Complete', 'HORROR! No Inclusion!');
//    });
});
