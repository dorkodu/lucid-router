export const LucidRouter = {
  create: create
};

const _LucidRouter = {
  router: {
    to: to,
    linkLucid: linkLucid,
    use: "",
    pages: {}
  },
  _Lucid: {},
  ignoreHashChange: false
};

/**
 * 
 * @param {object} properties
 * @param {('history' | 'hash')} properties.use 
 * @param {} properties.pages
 */
function create(properties) {
  for (const key in properties.pages) {
    properties.pages[key].regexPath = pathToRegex(properties.pages[key].path);
    properties.pages[key].name = key;
  }

  _LucidRouter.router.use = properties.use;
  _LucidRouter.router.pages = properties.pages;

  return _LucidRouter.router;
}

/**
 * 
 * @param {string} path 
 */
function pathToRegex(path) {
  return new RegExp("^" + path + "$", "i");
}

/**
 * 
 * @param {} lucid 
 */
function linkLucid(lucid) {
  _LucidRouter._Lucid = lucid;

  switch (_LucidRouter.router.use) {
    case "hash":
      window.location.href = "#" + _LucidRouter._Lucid.app.page.path.substr(1);

      window.addEventListener("hashchange", (e) => {
        e.preventDefault();

        // Check if hashchange should be ignored
        if (_LucidRouter.ignoreHashChange) {
          _LucidRouter.ignoreHashChange = false;
          return;
        }

        const url = "/" + window.location.hash.substr(1);
        const page = changePage(url);

        // Check if hooks exist, if exist, then call "disconnected" function if exists
        _LucidRouter._Lucid.app.page.hooks && _LucidRouter._Lucid.app.page.hooks.connected && _LucidRouter._Lucid.app.page.hooks.disconnected();

        // Change the current page then render with the payload
        _LucidRouter._Lucid.app.page = _LucidRouter.router.pages[page.name];
        _LucidRouter._Lucid.renderPage(page.payload);
      });
      break;
    case "history":
      break;
  }
}

/**
 * 
 * @param {string} pagePath 
 * @returns {{name: string, payload: string[]}}
 */
function to(pagePath) {
  switch (_LucidRouter.router.use) {
    case "hash":
      _LucidRouter.ignoreHashChange = true;
      window.location.href = "#" + pagePath.substr(1);
      const url = "/" + window.location.hash.substr(1);
      return changePage(url);
    case "history":
      break;
  }
}

/**
 * 
 * @param {string} url 
 * @returns {{name: string, payload: string[]}}
 */
function changePage(url) {
  for (const pageName in _LucidRouter.router.pages) {
    let match = url.match(_LucidRouter.router.pages[pageName].regexPath);
    if (match) {
      let payload = [];
      for (let i = 1; i < match.length; ++i)
        payload.push(match[i]);
      return { name: pageName, payload: payload };
    }
  }
}