// save incoming messages and print them out when a newline is recieved

const msgs: string[] = [];

function handleDenoStdin() {
  async function read() {
    const buf = new Uint8Array(1024);
    await Deno.stdin.read(buf);
    const end = buf.indexOf(0);
    const input = buf.slice(0, end);

    const str = new TextDecoder().decode(input);

    if (str === "\n") {
      logCurrentMsgs();
      read();
      return;
    } else if (str === "exit\n") {
      console.log("Exit recieved. Goodbye!");
      Deno.exit(0);
    }
    msgs.push(str);

    read();
  }
  read();
}

function logCurrentMsgs() {
  console.log("current recieved messages: ==========");
  console.log(msgs.join("").trim());
  console.log("=====================================");
}

function main() {
  console.log("Send me some messages!");
  console.log("I will print them out when you send a newline.");
  console.log("Send me 'exit' to exit.");
  handleDenoStdin();
}

main();
