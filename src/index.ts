let _use: "hash" | "history";
let _routes: { pattern: RegExp, cb: (...args: any[]) => void }[] = [];
let _redirects: { from: RegExp, to: string, cb: (...args: any[]) => void }[] = [];
let _fallback: (() => void) | undefined;

function run(use: "hash" | "history", cb?: () => void) {
  _use = use;

  if (cb) cb();

  if (use === "hash")
    window.addEventListener("hashchange", () => { to() })

  to();
}

function to(url?: string) {
  switch (_use) {
    case "hash":
      if (!url) {
        url = "/" + window.location.hash.substring(1);
      }
      else {
        window.location.hash = url.substring(1);
        return;
      }
      break;
    case "history":
      if (!url) {
        url = window.location.pathname;

        if (url.length > 1 && url.lastIndexOf("/") === url.length - 1)
          url = url.substring(0, url.length - 1);
      }
      else {
        window.history.replaceState(null, "", url);
      }
      break;
    default:
      return;
  }

  // Handle redirect
  for (let i = 0; i < _redirects.length; ++i) {
    const match = url.match(_redirects[i].from);
    if (match) {
      const oldUrl = url;
      _redirects[i].cb(...match.slice(1));
      const newUrl = url;

      if (oldUrl !== newUrl) {
        if (_use === "hash") {
          window.location.hash = _redirects[i].to;
          return;
        }
        else {
          url = _redirects[i].to;
          window.history.replaceState(null, "", url);
        }
      }
    }
  }

  // Handle routes
  for (let i = 0; i < _routes.length; ++i) {
    const match = url.match(_routes[i].pattern);
    if (match) {
      _routes[i].cb(...match.slice(1));
      return;
    }
  }

  // Handle fallback
  if (_fallback)
    _fallback();
}

function route(pattern: string, cb: (...args: any[]) => void) {
  _routes.push({
    pattern: new RegExp("^" + pattern + "$", "i"),
    cb: cb
  })
}

function redirect(pattern: string, to: string, cb: (...args: any[]) => void) {
  _redirects.push({
    from: new RegExp("^" + pattern + "$", "i"),
    to: to,
    cb: cb
  })
}

function fallback(cb: () => void) {
  _fallback = cb;
}

export const superpage = {
  run,
  to,
  route,
  redirect,
  fallback
};