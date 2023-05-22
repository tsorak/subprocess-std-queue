import { pop, push, stdin_queue } from "./queue.ts";

const runner_cmds: string[] = [];

function run() {
  const childProcess = new Deno.Command("deno", {
    args: ["run", "-A", "subprocess.ts"],
    stdin: "piped",
    stdout: "piped"
  }).spawn();

  async function readSubprocessStdout() {
    const loop = () => setTimeout(() => readSubprocessStdout(), 10);

    if (childProcess.stdout.locked || subp.stopped) {
      loop();
      return;
    }

    const reader = childProcess.stdout!.getReader();
    const output = (await reader.read()).value;
    if (output !== undefined) {
      const str = new TextDecoder().decode(output).trim();
      str.split("\n").forEach((line) => {
        console.log(`%c>%c ${line}`, "color: #f00", "color: initial");
      });
    }

    reader.releaseLock();
    loop();
  }

  async function writeSubprocessStdin() {
    const loop = () => setTimeout(() => writeSubprocessStdin(), 200);

    if (childProcess.stdin.locked || subp.stopped) {
      loop();
      return;
    }

    const queueItems: string[] = [];
    function popUntilEmpty() {
      const item = pop(stdin_queue);
      if (item === undefined) return;
      queueItems.push(item);
      popUntilEmpty();
    }
    popUntilEmpty();

    const data = queueItems.join("");

    const writer = childProcess.stdin!.getWriter();
    if (data !== undefined) {
      const input = new TextEncoder().encode(data);
      await writer.write(input);
    }

    writer.releaseLock();
    loop();
  }

  async function setStoppedOnExit() {
    const _ = await childProcess.status;
    subp.stopped = true;
  }

  interface SubP {
    childProcess: Deno.ChildProcess;
    stopped: boolean;
  }

  const subp: SubP = { childProcess, stopped: false };

  readSubprocessStdout();
  writeSubprocessStdin();
  setStoppedOnExit();

  return subp;
}

function handleDenoStdin() {
  async function read() {
    const buf = new Uint8Array(1024);
    await Deno.stdin.read(buf);
    const end = buf.indexOf(0);
    const input = buf.slice(0, end);

    const str = new TextDecoder().decode(input);
    if (str.startsWith("!")) {
      push(runner_cmds, str);
    } else {
      push(stdin_queue, str);
    }

    read();
  }

  read();
}

function runner() {
  let subp: ReturnType<typeof run>;
  function start() {
    console.log(
      "[%crunner%c] starting subprocess...",
      "color: #00f",
      "color: initial"
    );
    subp = run();
    handleSubprocessExit();
  }
  function stop() {
    console.log(
      "[%crunner%c] stopping subprocess...",
      "color: #00f",
      "color: initial"
    );
    subp.childProcess.kill();
  }
  async function handleSubprocessExit() {
    const { code } = await subp.childProcess.status;
    console.log(
      "[%crunner%c] subprocess exited with code %c" + code,
      "color: #00f",
      "color: initial",
      `color: ${!code ? "#0f0" : "#f00"}`
    );
  }

  function runCmds() {
    const loop = () => setTimeout(() => runCmds(), 200);

    const cmd = pop(runner_cmds)?.replace("!", "").trim();
    if (cmd === undefined) {
      loop();
      return;
    }
    switch (cmd) {
      case "restart":
        if (subp.stopped) break;
        stop();
        start();
        break;
      case "stop":
        if (subp.stopped) break;
        stop();
        break;
      case "start":
        if (!subp.stopped) break;
        start();
        break;
      case "status":
        console.log(
          "[%crunner%c] subprocess is %c" +
            (subp.stopped ? "stopped" : "running"),
          "color: #00f",
          "color: initial",
          `color: ${subp.stopped ? "#f00" : "#0f0"}`
        );
        break;
      case "help":
        console.log("Available commands:", [
          "start",
          "stop",
          "restart",
          "status",
          "help"
        ]);
        break;

      default:
        console.log("Unknown command:", { cmd });
        console.log("Type !help for a list of available commands.");
        break;
    }

    loop();
  }

  console.log(
    "[%crunner%c] Type !help for a list of available commands.",
    "color: #00f",
    "color: initial"
  );
  start();
  runCmds();
}

function main() {
  handleDenoStdin();
  runner();
}

main();
