# Subprocess Std Queue

Store the main processes stdin messages and have subprocesses pop them.

## Usage

```sh
deno task start
```

Prefixing with `!` runs messages through the main-processes command parser.

All other messages are put in a queue which `subprocess.ts` pops from.
