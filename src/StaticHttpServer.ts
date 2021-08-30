import {spawn, ChildProcess, execSync} from 'child_process';
import {join} from 'path';
import {stdout} from 'process';

const log = (msg: string): void => {
  stdout.write(msg);
};

interface DestroyableStream {
  destroyed: boolean;
  destroy(): void;

  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

interface ReadableStream extends DestroyableStream {
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: 'data', listener: (chunk: any) => void): this;
}

export class StaticHttpServer {
  private serverProcess?: ChildProcess;
  constructor(public readonly port: number) {}

  start(): void {
    // https://github.com/lukeed/sirv/tree/master/packages/sirv-cli
    const proc = spawn(
      '$(npm bin)/sirv',
      [join(__dirname, 'static-site1'), '--port', this.port.toString()],
      {
        detached: false,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    this.handleProcess(proc);
    this.handleDestroyable('stdin', proc.stdin);
    this.handleReadable('stdout', proc.stdout);
    this.handleReadable('stderr', proc.stderr);

    this.serverProcess = proc;

    // https://github.com/jeffbski/wait-on
    execSync(
      `$(npm bin)/wait-on http://localhost:${this.port} --delay 1000 --httpTimeout 30000`
    );
  }

  stop(): void {
    if (!this.serverProcess) {
      log('serverProcess was not defined\n');
      return;
    }
    const proc = this.serverProcess;
    this.killProcess(proc);
    this.destroyStream('stdin', proc.stdin);
    this.destroyStream('stdout', proc.stdout);
    this.destroyStream('stderr', proc.stderr);
    this.serverProcess = undefined;
  }

  handleProcess(p: ChildProcess): void {
    p.on('error', err => log(`serverProcess event error: ${err}\n`));
    p.on('close', (code, signal) =>
      log(`serverProcess event close: ${code} ${signal}\n`)
    );
    p.on('exit', (code, signal) =>
      log(`serverProcess event exit: ${code} ${signal}\n`)
    );
  }

  handleDestroyable(
    name: string,
    s: DestroyableStream | null,
    callback?: (prefix: string) => void
  ): void {
    if (!s) {
      log(`${name} is NOT given\n`);
      return;
    }
    const prefix = `serverProcess.${name} event`;
    s.on('close', () => log(`${prefix} closed\n`));
    s.on('error', err => log(`${prefix} error: ${err}\n`));
    if (callback) callback(prefix);
  }

  handleReadable(name: string, s: ReadableStream): void {
    this.handleDestroyable(name, s, prefix => {
      // eslint-disable-next-line
      s.on('data', (data: any) => log(`${prefix} data: ${data}`));
    });
  }

  killProcess(p: ChildProcess): void {
    log('serverProcess is being killed\n');
    if (p.kill('SIGTERM')) {
      log('serverProcess was killed with SIGTERM\n');
    } else if (p.kill()) {
      log('serverProcess was killed without signal\n');
    } else {
      log('serverProcess was NOT killed\n');
    }
  }

  destroyStream(name: string, s: DestroyableStream | null): void {
    const prefix = `serverProcess.${name}`;
    if (!s) {
      log(`${prefix} is NOT given\n`);
      return;
    }
    if (s.destroyed) {
      log(`${prefix} is already destroyed\n`);
    } else {
      log(`${prefix} is being destroyed\n`);
      s.destroy();
      log(`${prefix} was destroyed successfully\n`);
    }
  }
}
