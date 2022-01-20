OSDF Client Cache Locator
=========================

This is a [Cloudflare Worker](https://workers.cloudflare.com/) cache locator.  It receives requests from clients for the nearest cache and responds with an ordered list of caches.

The production URL is https://cache-location.osgstorage.org/_caches.

Publish new version
-------------------

Publish a new version of the worker with [Wrangler](https://github.com/cloudflare/wrangler).

    wrangler publish


