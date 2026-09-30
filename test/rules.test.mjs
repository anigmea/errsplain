import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {explain} from '../dist/index.js';
const examples={
 'node-port-in-use':'Error: listen EADDRINUSE: address already in use :::3000',
 'node-module-missing':"Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'x'",
 'npm-dependency-conflict':'npm error code ERESOLVE',
 'npm-engine-mismatch':'npm WARN EBADENGINE Unsupported engine',
 'file-permission':'Error: EACCES: permission denied',
 'file-missing':'Error: ENOENT: no such file or directory',
 'network-refused':'connect ECONNREFUSED 127.0.0.1:5432',
 'dns-failure':'getaddrinfo EAI_AGAIN example.invalid',
 'git-not-repository':'fatal: not a git repository (or any parent)',
 'git-unrelated-histories':'fatal: refusing to merge unrelated histories',
 'shell-command-missing':'zsh: command not found: foo',
 'json-invalid':'SyntaxError: Unexpected token < in JSON at position 0'
};
for(const [id,input] of Object.entries(examples)) test(id,()=>{const out=explain(input);assert.ok(out.some(x=>x.id===id));assert.equal(out[0].confidence,'pattern-match');assert.notEqual(explain(input,'hinglish')[0].meaning,out[0].meaning);});
test('unknown/empty logs get no invented explanation',()=>{assert.deepEqual(explain(''),[]);assert.deepEqual(explain('segmentation fault'),[]);assert.deepEqual(explain('everything worked'),[]);});
test('ANSI colors and hyperlinks normalized',()=>{assert.equal(explain('\x1b[31mEADDRINUSE\x1b[0m')[0].id,'node-port-in-use');assert.equal(explain('\x1b]8;;https://x.invalid\x07EADDRINUSE\x1b]8;;\x07')[0].id,'node-port-in-use');});
test('multiple patterns, each only once',()=>{const out=explain('EADDRINUSE EADDRINUSE\nENOENT');assert.equal(out.length,2);assert.equal(new Set(out.map(x=>x.id)).size,2);});
test('user input never interpolated into output',()=>{const secret='my_private_token_987';assert.ok(!JSON.stringify(explain('EACCES '+secret)).includes(secret));});
test('library rejects wrong type/language/oversized input',()=>{assert.throws(()=>explain(null));assert.throws(()=>explain('x','spanish'));assert.throws(()=>explain('x'.repeat(1_048_577)));});
test('results have fresh suggestion arrays',()=>{const a=explain('EACCES');a[0].suggestions.length=0;assert.ok(explain('EACCES')[0].suggestions.length>0);});
test('CLI JSON and unknown exit codes',()=>{const run=(input,args=[])=>spawnSync(process.execPath,['dist/cli.js',...args,'-'],{input,encoding:'utf8'});let x=run('EADDRINUSE',['--json']);assert.equal(x.status,0);assert.equal(JSON.parse(x.stdout).matched,true);x=run('unknown',['--json']);assert.equal(x.status,2);assert.equal(JSON.parse(x.stdout).matched,false);x=run('EACCES',['--hinglish']);assert.match(x.stdout,/sudo/);x=run('x',['--nope']);assert.equal(x.status,1);});
test('CLI input limited to 1 MiB',()=>{const x=spawnSync(process.execPath,['dist/cli.js','-'],{input:'x'.repeat(1_048_577),encoding:'utf8'});assert.equal(x.status,1);assert.match(x.stderr,/1 MiB/);});
test('CLI never executes text',()=>{const x=spawnSync(process.execPath,['dist/cli.js','--json','-'],{input:'echo EADDRINUSE; touch /tmp/errsplain-must-not-exist',encoding:'utf8'});assert.equal(x.status,0);assert.equal(existsSync('/tmp/errsplain-must-not-exist'),false);});
