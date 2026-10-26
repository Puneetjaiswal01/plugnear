export const SESSION_REQUIRED =
  "Your session ended. Sign in again to search chargers or manage bookings.";

/** Client recovery only. Supabase validates JWTs, roles and row access server-side. */
export function sessionFetch(
  projectUrl: string,
  projectKey: string,
  onRequired: () => void,
  transport: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  const origin = new URL(projectUrl).origin;
  return async (input, init) => {
    const request =
      typeof Request !== "undefined" && input instanceof Request ? input : null;
    const url = new URL(request?.url ?? String(input));
    const protectedData =
      url.origin === origin && url.pathname.startsWith("/rest/v1/");
    if (protectedData) {
      const headers = new Headers(init?.headers ?? request?.headers);
      const token = headers
        .get("authorization")
        ?.match(/^Bearer\s+(.+)$/i)?.[1]
        ?.trim();
      if (
        !token ||
        token === projectKey ||
        token.startsWith("sb_publishable_") ||
        token.startsWith("sb_secret_")
      ) {
        onRequired();
        throw new Error(SESSION_REQUIRED);
      }
    }
    const response = await transport(input, init);
    if (protectedData && response.status === 401) onRequired();
    return response;
  };
}

export function hasSessionToken(
  session: { access_token?: string; user?: { id?: string } } | null,
  key: string,
) {
  return (
    !!session?.user?.id &&
    !!session.access_token &&
    session.access_token !== key &&
    !session.access_token.startsWith("sb_")
  );
}
