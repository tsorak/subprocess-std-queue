const stdin_queue: string[] = [];
const _stdout_queue: string[] = [];

function push(queue: string[], data: string) {
  queue.push(data);
}

function pop(queue: string[]) {
  return queue.shift();
}

export { stdin_queue, push, pop };
