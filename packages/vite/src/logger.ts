import pc from 'picocolors';

// Matches the format of Vite's logger (`10:00:00 AM [prefix] message`) without
// importing Vite, which keeps `pastoria generate` startup fast.
// Formatted by hand: `toLocaleTimeString` initializes Intl, which is slow.
function timestamp() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return pc.dim(`${h}:${mm}:${ss} ${d.getHours() < 12 ? 'AM' : 'PM'}`);
}

export function logInfo(...messages: string[]) {
  console.log(
    `${timestamp()} ${pc.greenBright('[pastoria]')} ${messages.join(' ')}`,
  );
}

export function logWarn(...messages: string[]) {
  console.warn(
    `${timestamp()} ${pc.yellow('[! warn !]')} ${pc.yellow(messages.join(' '))}`,
  );
}
