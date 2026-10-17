// SugarCRM SmartGateway client.
// Every request carries an X-Api-Token: base64(json + "||" + HMAC-SHA256(json, secret)) where json = {"ts": unix seconds}.
// Tokens expire after 5 minutes on the server, so a fresh one is signed per request.

const CRM_URL = (import.meta.env.VITE_CRM_URL || '/crm').replace(/\/$/, '');
const SECRET = import.meta.env.VITE_GATEWAY_SECRET || 'MY_SUPER_SECRET_123';

const GATEWAY = `${CRM_URL}/index.php?entryPoint=smart_gateway`;
const AUTH = `${CRM_URL}/index.php?entryPoint=taskflow_auth`;

const enc = new TextEncoder();
let keyPromise;
const hmacKey = () =>
  (keyPromise ||= crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']));

async function signToken() {
  const json = JSON.stringify({ ts: Math.floor(Date.now() / 1000) });
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(json)));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
  return btoa(json + '||' + hex);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function post(url, body, headers = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the CRM server. Is XAMPP (Apache + MySQL) and the PHP 7.4 worker running?', 0);
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError('The CRM returned an unexpected response: ' + text.replace(/<[^>]+>/g, ' ').trim().slice(0, 160), res.status);
  }
  if (!res.ok || data.success === false) throw new ApiError(data.error || data.message || `Request failed (${res.status})`, res.status);
  return data;
}

export const gateway = async (body) => post(GATEWAY, body, { 'X-Api-Token': await signToken() });

/** Fetch every record of a module (pages through results 200 at a time). */
export async function fetchAll(module, { fields, filters, order_by = 'date_entered', order_dir = 'DESC' } = {}) {
  const out = [];
  for (let page = 1; ; page++) {
    const r = await gateway({ action: 'fetch', module, fields, filters, order_by, order_dir, page, per_page: 200 });
    out.push(...r.records);
    if (page >= r.total_pages) return out;
  }
}

export const createRecord = (module, data) => gateway({ action: 'create', module, data }).then((r) => r.id);
export const updateRecord = (module, id, data) => gateway({ action: 'update', module, id, data });
export const deleteRecord = (module, id) => gateway({ action: 'delete', module, id });

export const login = (user_name, password) => post(AUTH, { user_name, password });
