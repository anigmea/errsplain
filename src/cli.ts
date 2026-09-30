#!/usr/bin/env node
import { explain } from './index.js';
const help='errsplain [--hinglish] [--json] [file|-]\nReads an error log from a file or piped stdin; never runs the failing command.\nKnown patterns only. Unknown errors get no invented diagnosis.\nExit codes: 0 matched, 2 unknown/empty, 1 bad input. No network or LLM.';
try {
 const args=process.argv.slice(2);
 if(args.includes('--help')) console.log(help);
 else if(args.includes('--version')) console.log('0.1.0');
 else {
  const flags=new Set(args.filter(x=>x.startsWith('--')));
  for(const f of flags) if(!['--hinglish','--json'].includes(f)) throw new Error(`Unknown option: ${f}`);
  const paths=args.filter(x=>!x.startsWith('--'));
  if(paths.length>1) throw new Error('Supply at most one input file');
  const path=paths[0]||'-';
  if(path==='-'&&process.stdin.isTTY) throw new Error(help);
  // Bounded read: no unbounded buffering of an arbitrarily large log.
  const fs = await import('node:fs');
  const stream=path==='-'?process.stdin:fs.createReadStream(path);
  const chunks:Buffer[]=[];let total=0;
  try { for await (const chunk of stream) { const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);total+=b.length;if(total>1_048_576)throw new Error('Input exceeds 1 MiB');chunks.push(b); } }
  finally { if(path!=='-')stream.destroy(); }
  const results=explain(Buffer.concat(chunks).toString('utf8'),flags.has('--hinglish')?'hinglish':'english');
  if(flags.has('--json')) console.log(JSON.stringify({matched:results.length>0,explanations:results}));
  else if(!results.length) console.log('No known pattern matched. Keep the original log; this tool will not make up a fix.');
  else for(const r of results) console.log(`${r.title}\n${r.meaning}\n${r.suggestions.map(s=>'- '+s).join('\n')}\n[pattern match, not a guaranteed root cause]\n`);
  if(!results.length)process.exitCode=2;
 }
} catch(e) {console.error(JSON.stringify({error:e instanceof Error?e.message:String(e)}));process.exitCode=1;}
