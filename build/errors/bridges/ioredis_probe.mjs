// Runs one command, or one MULTI/EXEC block, through ioredis and prints what it returns or throws.
// Arguments: port user password mode payload...  (see _common.py for the format)
import Redis from 'ioredis';

const [port, user, password, mode, ...payload] = process.argv.slice(2);
const arg = (s) => (s.startsWith('hex:') ? Buffer.from(s.slice(4), 'hex') : s);
const tokens = (p) => p.split('\x01').map(arg);
const one = (s) => String(s).replace(/[\r\n]+/g, ' ');
const describe = (e) => `EXC\t${e.constructor.name}\t${one(e.message)}`;

// No reconnecting, so a refused or closed connection ends the probe.
const client = new Redis({
  host: '127.0.0.1', port: Number(port), connectTimeout: 5000, retryStrategy: () => null,
  // By default ioredis waits while the server is loading its data. IOREDIS_READY_CHECK=0 turns that off.
  ...(process.env.IOREDIS_READY_CHECK === '0' ? { enableReadyCheck: false } : {}),
  ...(user ? { username: user } : {}), ...(password ? { password } : {}),
});
let connectError = null;
client.on('error', (e) => { connectError = e; });

try {
  if (mode === 'cmd') {
    const [name, ...args] = tokens(payload[0]);
    console.log('OK\t' + one(await client.call(name, ...args)));
  } else {
    const m = client.multi();
    for (const p of payload) { const [name, ...args] = tokens(p); m.call(name, ...args); }
    const r = await m.exec();
    console.log('OK\t' + one(JSON.stringify(r.map(([e, v]) => (e ? `${e.constructor.name}: ${e.message}` : v)))));
  }
} catch (e) {
  console.log(describe(e) + (connectError && connectError !== e ? ` [error event ${connectError.constructor.name}: ${one(connectError.message)}]` : ''));
} finally {
  client.disconnect();
}
