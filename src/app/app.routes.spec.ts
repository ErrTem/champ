import { routes } from './app.routes';

type RouteLike = {
  path?: string;
  redirectTo?: string;
  pathMatch?: string;
  children?: RouteLike[];
};

function flattenRoutes(rs: RouteLike[]): RouteLike[] {
  const out: RouteLike[] = [];
  for (const r of rs) {
    out.push(r);
    if (Array.isArray(r.children)) out.push(...flattenRoutes(r.children));
  }
  return out;
}

describe('app.routes', () => {
  it('should default / to /explore and wildcard to /explore', () => {
    const all = flattenRoutes(routes as RouteLike[]);

    expect(
      all.some((r) => r.path === '' && r.redirectTo === 'explore' && r.pathMatch === 'full'),
    ).toBeTrue();

    expect(all.some((r) => r.path === '**' && r.redirectTo === 'explore')).toBeTrue();
  });

  it('should include legacy alias redirects', () => {
    const all = flattenRoutes(routes as RouteLike[]);

    expect(
      all.some(
        (r) =>
          r.path === 'my-bookings' &&
          r.redirectTo === 'bookings' &&
          r.pathMatch === 'full',
      ),
    ).toBeTrue();

    expect(
      all.some(
        (r) =>
          r.path === 'fighters/:fighterId' &&
          r.redirectTo === 'explore/fighters/:fighterId' &&
          r.pathMatch === 'full',
      ),
    ).toBeTrue();
  });
});

