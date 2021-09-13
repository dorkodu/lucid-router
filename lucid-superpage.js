const _LucidSuperpage = {
  router: {
    redirect: redirect,
    fallback: fallback,
    route: route,
    run: run,
    to: to,
    /** @type {string} */
    use: null
  },
  routes: [],
  redirects: {},
  /** @type {function} */
  fallback: null
};

function redirect(from, to) {
  _LucidSuperpage.redirects[from] = to;
}

function fallback(callback) {
  _LucidSuperpage.fallback = callback;
}

function route(pattern, callback) {
  _LucidSuperpage.routes.push({
    pattern: new RegExp("^" + pattern + "$", "i"),
    callback: callback
  })
}

function run(use, callback) {
  _LucidSuperpage.router.use = use;

  if (callback)
    callback();

  // If router works with hash, add a hashchange listener
  if (_LucidSuperpage.router.use === "hash")
    window.addEventListener("hashchange", () => { to() });

  to();
}

/**
 * 
 * @param {string} [url] Target url, if no url is specified, depending on the use type of the router, hash or pathname will be used.
 */
function to(url) {
  switch (_LucidSuperpage.router.use) {
    case "hash":
      if (!url) {
        url = "/" + window.location.hash.substr(1);
      } else {
        window.location.hash = url.substr(1);
        return;
      }
      break;
    case "history":
      if (!url) {
        url = window.location.pathname;

        if (url.length > 1 && url.lastIndexOf("/") === url.length - 1)
          url = url.substr(0, url.length - 1);
      } else {
        window.history.replaceState(null, null, url);
      }
      break;
  }

  // If a redirect for the url is present, redirect to the new url
  const redirect = _LucidSuperpage.redirects[url];
  if (redirect) {
    if (_LucidSuperpage.router.use === "hash") {
      window.location.hash = redirect.substr(1);
      return;
    } else {
      url = redirect;
      window.history.replaceState(null, null, url);
    }
  }

  // Match the url with the routes
  let matched = false;
  for (let i = 0; i < _LucidSuperpage.routes.length; ++i) {
    const match = url.match(_LucidSuperpage.routes[i].pattern);
    if (match) {
      _LucidSuperpage.routes[i].callback(...match.slice(1));
      matched = true;
      return;
    }
  }

  // If there is no match, run the fallback function if exists
  if (!matched && _LucidSuperpage.fallback) {
    _LucidSuperpage.fallback();
  }
}

export const superpage = _LucidSuperpage.router;