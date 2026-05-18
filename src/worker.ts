interface StaticAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: StaticAssetsBinding;
}

const CANONICAL_PUBLIC_SITE_ORIGIN = "https://cyberbuild.ca";
const LEGACY_PUBLIC_SITE_HOSTS = new Set([
  "cyberspacebuildingcorp.ca",
  "www.cyberspacebuildingcorp.ca",
]);

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const url = new URL(request.url);

    if (LEGACY_PUBLIC_SITE_HOSTS.has(url.hostname)) {
      const target = new URL(`${url.pathname}${url.search}`, CANONICAL_PUBLIC_SITE_ORIGIN);
      return Response.redirect(target.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
