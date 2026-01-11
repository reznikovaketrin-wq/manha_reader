export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // RFC4122 version 4 UUID
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    return [hex.substr(0,8), hex.substr(8,4), hex.substr(12,4), hex.substr(16,4), hex.substr(20,12)].join('-');
  }
  // fallback
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
}

export function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getOrCreateClientId() {
  const COOKIE_NAME = 'triw_client_id';
  try {
    let id = getCookie(COOKIE_NAME);
    if (!id) {
      id = generateUUID();
      setCookie(COOKIE_NAME, id, 365 * 5);
    }
    return id;
  } catch (e) {
    return generateUUID();
  }
}
