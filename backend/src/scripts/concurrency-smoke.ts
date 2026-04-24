/* eslint-disable no-console */
type Json = Record<string, unknown>;

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const PARALLELISM = Number(process.env.N ?? process.env.PARALLELISM ?? 10);

const DEFAULT_FIGHTER_ID = 'ftr_ali_01';
const DEFAULT_SERVICE_ID = 'svc_ali_60_ip';

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
  const parts = setCookies
    .map((c) => c.split(';')[0]?.trim())
    .filter(Boolean);
  return parts.join('; ');
}

async function parseJson(res: Response): Promise<Json> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Json;
  } catch {
    return { raw: text };
  }
}

function getCode(payload: Json): string | undefined {
  const direct = payload.code;
  if (typeof direct === 'string') return direct;
  const msg = payload.message;
  if (msg && typeof msg === 'object') {
    const nested = (msg as Json).code;
    if (typeof nested === 'string') return nested;
  }
  return undefined;
}

async function ensureCookie(): Promise<string> {
  if (process.env.COOKIE) return process.env.COOKIE;

  const email =
    process.env.EMAIL ?? `smoke_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
  const password = process.env.PASSWORD ?? `Pass_${Math.random().toString(16).slice(2)}_1234`;

  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!registerRes.ok) {
    const body = await parseJson(registerRes);
    throw new Error(
      `Failed to register test user: ${registerRes.status} ${JSON.stringify(body)}`,
    );
  }

  const hdrs = registerRes.headers as unknown as { getSetCookie?: () => string[] };
  const setCookies =
    typeof hdrs.getSetCookie === 'function'
      ? hdrs.getSetCookie()
      : registerRes.headers.get('set-cookie')
        ? [registerRes.headers.get('set-cookie') as string]
        : [];

  if (setCookies.length === 0) {
    throw new Error(
      'No set-cookie headers returned from /auth/register. Provide COOKIE env var instead.',
    );
  }

  return cookieHeaderFromSetCookie(setCookies);
}

async function main() {
  const fighterId = process.env.FIGHTER_ID ?? DEFAULT_FIGHTER_ID;
  const serviceId = process.env.SERVICE_ID ?? DEFAULT_SERVICE_ID;

  const cookie = await ensureCookie();

  const availabilityRes = await fetch(
    `${BASE_URL}/availability?fighterId=${encodeURIComponent(fighterId)}&serviceId=${encodeURIComponent(serviceId)}`,
    { headers: { cookie } },
  );

  if (!availabilityRes.ok) {
    const body = await parseJson(availabilityRes);
    throw new Error(
      `Availability request failed: ${availabilityRes.status} ${JSON.stringify(body)}`,
    );
  }

  const availability = (await availabilityRes.json()) as {
    days?: Array<{ slots?: Array<{ slotId: string; status: string }> }>;
  };

  const slotId =
    availability.days
      ?.flatMap((d) => d.slots ?? [])
      .find((s) => s.status === 'available')?.slotId ?? null;

  if (!slotId) {
    throw new Error('No available slotId found. Seed data and availability generation may be missing.');
  }

  const start = Date.now();
  const results = await Promise.all(
    Array.from({ length: PARALLELISM }).map(async () => {
      const res = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ slotId }),
      });

      const body = await parseJson(res);
      return { status: res.status, code: getCode(body), body };
    }),
  );

  const ok201 = results.filter((r) => r.status === 201);
  const conflicts409 = results.filter(
    (r) => r.status === 409 && (r.code === 'SLOT_UNAVAILABLE' || JSON.stringify(r.body).includes('SLOT_UNAVAILABLE')),
  );

  const durationMs = Date.now() - start;

  if (ok201.length === 1 && conflicts409.length === PARALLELISM - 1) {
    console.log(
      `PASS concurrency smoke: 1x201, ${PARALLELISM - 1}x409(SLOT_UNAVAILABLE) in ${durationMs}ms (slotId=${slotId})`,
    );
    process.exit(0);
  }

  console.error('FAIL concurrency smoke');
  console.error(JSON.stringify({ slotId, PARALLELISM, ok201, conflicts409, results }, null, 2));
  process.exit(1);
}

main().catch((e) => {
  console.error(`FAIL concurrency smoke: ${String(e?.message ?? e)}`);
  process.exit(1);
});

