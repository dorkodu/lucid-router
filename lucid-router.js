export const LucidRouter = {
  createRouter: createRouter
};

const _LucidRouter = {
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

/**
 * 
 * @param {"hash" | "history"} use 
 */
function createRouter(use) {
  _LucidRouter.router.use = use;

  return _LucidRouter.router;
}

function redirect(from, to) {
  _LucidRouter.redirects[from] = to;
}

function fallback(callback) {
  _LucidRouter.fallback = callback;
}

function route(pattern, callback) {
  _LucidRouter.routes.push({
    pattern: new RegExp("^" + pattern + "$", "i"),
    callback: callback
  })
}

function run(callback) {
  if (callback)
    callback();

  // If router works with hash, add a hashchange listener
  if (_LucidRouter.router.use === "hash")
    window.addEventListener("hashchange", () => { to() });

  to();
}

/**
 * 
 * @param {string} [url] Target url, if no url is specified, depending on the use type of the router, hash or pathname will be used.
 */
function to(url) {
  switch (_LucidRouter.router.use) {
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
  const redirect = _LucidRouter.redirects[url];
  if (redirect) {
    if (_LucidRouter.router.use === "hash") {
      window.location.hash = redirect.substr(1);
      return;
    } else {
      url = redirect;
      window.history.replaceState(null, null, url);
    }
  }

  // Match the url with the routes
  let matched = false;
  for (let i = 0; i < _LucidRouter.routes.length; ++i) {
    const match = url.match(_LucidRouter.routes[i].pattern);
    if (match) {
      _LucidRouter.routes[i].callback(...match.slice(1));
      matched = true;
      return;
    }
  }

  // If there is no match, run the fallback function if exists
  if (!matched && _LucidRouter.fallback) {
    _LucidRouter.fallback();
  }
}