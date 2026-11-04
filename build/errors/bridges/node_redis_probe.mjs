// Runs one command, or one MULTI/EXEC block, through node-redis and prints what it returns or throws.
// Arguments: port user password mode payload...  (see _common.py for the format)
import { createClient } from 'redis';

const [port, user, password, mode, ...payload] = process.argv.slice(2);
const arg = (s) => (s.startsWith('hex:') ? Buffer.from(s.slice(4), 'hex') : s);
const tokens = (p) => p.split('\x01').map(arg);
const one = (s) => String(s).replace(/[\r\n]+/g, ' ');

function describe(e) {
  let msg = one(e.message);
  // A transaction whose commands failed reports each error in the list it throws.
  if (e.replies) msg += ' [errors: ' + e.errorIndexes.map((i) => `${e.replies[i]?.constructor?.name}: ${one(e.replies[i]?.message)}`).join('; ') + ']';
  return `EXC\t${e.constructor.name}\t${msg}`;
}

const client = createClient({
  socket: { host: '127.0.0.1', port: Number(port), connectTimeout: 5000, reconnectStrategy: false },
  ...(user ? { username: user } : {}),
  ...(password ? { password } : {}),
});
client.on('error', () => {});

try {
  await client.connect();
  if (mode === 'cmd') {
    const r = await client.sendCommand(tokens(payload[0]));
    console.log('OK\t' + one(r));
  } else {
    const m = client.multi();
    for (const p of payload) m.addCommand(tokens(p));
    console.log('OK\t' + one(await m.exec()));
  }
} catch (e) {
  console.log(describe(e));
} finally {
  client.destroy();
}
