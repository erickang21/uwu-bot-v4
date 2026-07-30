// The API helpers are plain functions with no reference to the client, so the
// analytics manager is registered here once during startup rather than threaded
// through every helper signature. One registration per process, which under
// sharding means one per shard — the same scope the metric buffer lives in.

let analyticsManager = null;

function setAnalyticsManager(manager) {
  analyticsManager = manager;
}

function apiNameFor(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function recordApiResult(url, { ok, fellBack = false }) {
  const api = apiNameFor(url);
  if (!api) return;
  analyticsManager?.apiResult({ api, ok, fellBack });
}

/**
 * For helpers that throw on failure.
 */
async function trackApi(url, run) {
  try {
    const result = await run();
    recordApiResult(url, { ok: true });
    return result;
  } catch (error) {
    recordApiResult(url, { ok: false });
    throw error;
  }
}

/**
 * For helpers that resolve to a null-ish payload on failure so the caller can
 * fall back to the local image cache. A null payload is itself the fallback
 * signal, so it is recorded as both a failure and a fallback.
 */
async function trackNullableApi(url, run, isOk = (result) => Boolean(result?.url)) {
  let result;
  try {
    result = await run();
  } catch (error) {
    recordApiResult(url, { ok: false, fellBack: true });
    throw error;
  }
  const ok = isOk(result);
  recordApiResult(url, { ok, fellBack: !ok });
  return result;
}

module.exports = {
  setAnalyticsManager,
  apiNameFor,
  recordApiResult,
  trackApi,
  trackNullableApi
};
