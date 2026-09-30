# errsplain

Your terminal is yelling. Let it errsplain.

A tiny offline error-log explainer. English by default, `--hinglish` when the stack trace needs a bhai. No LLM, API key, network request or command execution.

Status: unpublished 0.1.0 candidate. Node 18+, ESM. Zero runtime dependencies.

## Reviewed checkout

```sh
npm ci
npm run build
npm test
printf 'Error: listen EADDRINUSE :::3000' | node dist/cli.js -
printf 'npm error code ERESOLVE' | node dist/cli.js --hinglish -
node dist/cli.js --json error.log
```

After publication: `npx errsplain error.log`, or install `errsplain` for the library.

Save the ORIGINAL failing command's log yourself, then pass that file here. errsplain never runs or retries the failing command, installs packages, kills processes, changes permissions or edits your repo.

## Example

Input: `Error: listen EADDRINUSE: address already in use :::3000`

Output:

```text
That port already has a tenant
A process is already listening on the requested address/port. This does not identify which process or prove it is safe to stop.
- Inspect listening processes using your OS tools, or choose another port.
- Stop a process only after confirming it belongs to your project.
[pattern match, not a guaranteed root cause]
```

`--hinglish` changes the explanation to: "Port pe pehle se koi baitha hai. Kaun hai aur band karna safe hai ya nahi, pehle check karo." Suggestions stay in English.

## Library

```ts
import { explain } from 'errsplain';
const matches = explain('Error: ENOENT: no such file or directory');
const desi = explain('npm error code ERESOLVE', 'hinglish');
```

Each match includes `id`, `title`, `meaning`, `suggestions`, `confidence: 'pattern-match'` and `matchedPattern`. Output never includes the original log or interpolates values from it. Unknown input returns an empty array.

## Known patterns in v0.1

12 rules: EADDRINUSE, missing Node modules/packages, npm ERESOLVE, EBADENGINE, EACCES/EPERM, ENOENT, ECONNREFUSED, ENOTFOUND/EAI_AGAIN, Git not-a-repository, unrelated Git histories, shell command-not-found, and a limited JSON/parser error pattern.

Multiple patterns can match one log; each rule appears once. Terminal ANSI colors and OSC hyperlinks are stripped for matching. Input is limited to 1 MiB in both the CLI and library.

## Exit codes

- 0: at least one known pattern matched (or help/version printed).
- 2: empty or unknown input. This is deliberately not a successful diagnosis.
- 1: invalid options, unreadable input or oversized log.

JSON output: `{ "matched": true, "explanations": [...] }`. Read errors go to stderr as JSON. With no file argument, piped stdin is read; interactive stdin is refused to avoid a mystery hang.

## Real limits

This is a rule pack, not a universal debugger. A code may appear in quoted examples, warnings or an unrelated line, so false matches are possible. It cannot identify the root cause, interpret arbitrary languages, know your project context, or prove a suggested fix is safe. Parser messages can be ambiguous; inspect the original input.

No wrapper-execution mode, telemetry or external upload. The input remains local, but the command that produced it may already have exposed secrets, and this tool is not a secret scanner. It does not log original input; the caller is responsible for storing/sharing logs safely.

Tests use synthetic fixtures, not a claim of broad field coverage. Platform-specific error messages vary. Current tests cover each rule, unknown input, ANSI handling, multiple matches, non-interpolation, size limits and CLI behavior.

## Release

`npm publish --access public` rebuilds and tests via prepublishOnly. Publish only after owner review/merge and a separate go-ahead. Source/tests and credentials are excluded from the npm archive. MIT.
