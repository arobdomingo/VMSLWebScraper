"""Bounded public-site fetching with a small per-process TTL cache.

The lock coalesces concurrent misses, trading parallel fetches for predictable
upstream load. Failed responses are never cached.
"""

import os
import time
from collections import OrderedDict
from threading import Lock
import httpx


class UpstreamError(Exception):
    """The source could not provide a usable response."""


_cache = OrderedDict()
_lock = Lock()
TTL_SECONDS = int(os.getenv("SCRAPE_CACHE_TTL", "300"))


def get_html(url, parameters=None):
    key = (url, tuple(sorted((str(k), str(v)) for k, v in (parameters or {}).items())))
    with _lock:
        cached = _cache.get(key)
        if cached and time.monotonic() - cached[0] < TTL_SECONDS:
            return cached[1]
        try:
            with httpx.Client(
                follow_redirects=True,
                timeout=20,
                transport=httpx.HTTPTransport(retries=1),
            ) as client:
                response = client.get(url, params=parameters)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError("Source request failed") from exc
        _cache[key] = (time.monotonic(), response.text)
        _cache.move_to_end(key)
        while len(_cache) > 64:
            _cache.popitem(last=False)
        return response.text
