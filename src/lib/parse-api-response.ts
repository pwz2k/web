/**
 * Parse fetch Response as JSON. HTML bodies (nginx/Next error pages) throw a clear error
 * instead of `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
 */
export async function parseResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) {
    const hint =
      response.status === 502
        ? ' Nginx 502: the upstream (Next.js on proxy_pass) is down, crashed, or wrong port. On the server: curl -sS http://127.0.0.1:3000/api/health and pm2 logs.'
        : '';
    throw new Error(
      `Server returned HTML instead of JSON (${response.status}).${hint} Check the API URL, reverse proxy, and that the app is deployed.`
    );
  }
  if (!trimmed) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON response: ${text.slice(0, 160)}${text.length > 160 ? '…' : ''}`
    );
  }
}
