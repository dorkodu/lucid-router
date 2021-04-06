export const LucidRouter = {
  createPage: createPage,
  createRouter: createRouter
};

const _LucidRouter = {
  router: {
    linkLucid: linkLucid,
    run: run,
    to: to,
    forward: forward,
    back: back,
    use: "",
  },
  _Lucid: {},
  pages: {},
  error: {},
  basePath: "",
  currentPage: "",
  ignoreHashChange: false
};

/**
 * @typedef {object} Component
 * 
 * @property {string} name
 * @property {object} state 
 * @property {() => string} render 
 * @property {Object.<string, Function>} methods 
 * @property {Hooks} hooks
 * @property {object} attributes 
 * @property {Object.<string, Function>} watch 
 * @property {Skeleton} skeleton
 */

/**
 * @typedef {object} Skeleton
 * 
 * @property {string} tag
 * @property {Object.<string, string>} attrs
 * @property {Skeleton[]} children
 */

/**
 * 
 * @param {object} properties 
 * @param {Component[]} properties.components
 * @param {string} properties.path
 * @param {object} [properties.state]
 * @param {object} [properties.attributes]
 * @param {Object.<string, Function>} [properties.methods] 
 * @param {() => string} properties.render
 * @param {Hooks} [properties.hooks]
 * @param {Object.<string, Function>} [properties.watch]
 */
function createPage(properties) {
  return {
    components: properties.components,
    state: properties.state,
    attributes: properties.attributes,
    methods: properties.methods,
    render: properties.render,
    hooks: properties.hooks,
    watch: properties.watch,
    skeleton: null
  };
}

/**
 * @typedef {object} Hooks
 * 
 * @property {Function} [created]
 * @property {Function} [connected]
 * @property {Function} [disconnected] 
 * @property {Function} [updated]
 */

/**
 * 
 * @param {('history' | 'hash')} use 
 * @param {{name: string, path: string, source: object | string}[]} pages
 * @param {{path: string, source: object | string}[]} error
 */
function createRouter(use, pages, error) {
  _LucidRouter.router.use = use;
  _LucidRouter.basePath = pages[0].path;
  for (let i = 0; i < pages.length; ++i) {
    _LucidRouter.pages[pages[i].name] = {
      path: pages[i].path,
      source: pages[i].source,
      regexPath: parse(pages[i].path)
    };
  }
  _LucidRouter.error = error;

  return _LucidRouter.router;
}

function linkLucid(lucid) {
  _LucidRouter._Lucid = lucid;
}

function run() {
  switch (_LucidRouter.router.use) {
    case "hash":
      changePageWithHash();

      // Add an event listener to listen for url changes
      window.addEventListener("hashchange", () => {
        changePageWithHash();
      });
      break;
    case "history":
      changePageWithHistory();
      break;
  }
}

function changePageWithHash() {
  // Get the current url from hash location
  let url = "/" + window.location.hash.substr(1);

  // If url is not set to any sub-path, set it to base path
  if (url === "/") {
    url = _LucidRouter.basePath;
    window.location.hash = url.substr(1);
  }

  changePageTo(url)
}

function changePageWithHistory() {
  let url = window.location.pathname;

  // If url is not set to any sub-path, set it to base path
  if (url === "/") {
    url = _LucidRouter.basePath;
  }

  // Remove the last slash from the url if exists
  if (url.lastIndexOf("/") === url.length - 1)
    url = url.substring(0, url.length - 1)

  changePageTo(url)
}

/**
 * 
 * @param {string} url URL of the target page
 */
function changePageTo(url) {
  let targetPage;
  let isErrorPage = false;

  // Match the url with existing pages, if there are no matches, render the error page
  let result = match(url);
  if (!result) {
    // If there is a error page to render
    if (_LucidRouter.error) {
      // Change the target page to error page, set error page to true and
      // set result.name to "Error" since it's name of the error page's component
      // as well as payload to null since there can't be any payload
      _LucidRouter.currentPage = "Error";
      targetPage = _LucidRouter.error;
      isErrorPage = true;
      result = { name: "Error", payload: null };
    } else {
      // The destination page and the error page could not be found,
      // so there is nothing to render, return
      return;
    }
  } else {
    // Set the current page's name to currentPage for later use
    _LucidRouter.currentPage = result.name;
    targetPage = _LucidRouter.pages[result.name];
  }

  if (typeof targetPage.source === "string") {
    import(targetPage.source).then((module) => {
      targetPage.source = module.default;

      // Declare the page inside lucid, since a page in it's origin still a component
      _LucidRouter._Lucid.components[result.name] = {
        name: result.name,
        state: targetPage.source.state,
        methods: targetPage.source.methods,
        render: targetPage.source.render,
        hooks: targetPage.source.hooks,
        attributes: targetPage.source.attributes,
        watch: targetPage.source.watch,
        skeleton: null
      };

      // If page has components, save them into lucid
      if (targetPage.source.components) {
        for (let i = 0; i < targetPage.source.components.length; ++i) {
          // Get the component into a single variable, it's easier to work with :)
          const component = targetPage.source.components[i];

          // Declare the component inside lucid
          _LucidRouter._Lucid.components[component.name] = {
            name: component.name,
            state: component.state,
            methods: component.methods,
            render: component.render,
            hooks: component.hooks,
            attributes: component.attributes,
            watch: component.watch,
            skeleton: null
          };
        }
      }

      // Render the page after the import
      renderPage(result.name, result.payload);

      // Push the state after the page is rendered
      if (_LucidRouter.router.use === "history")
        history.replaceState(null, null, isErrorPage ? _LucidRouter.error.path : url + window.location.search + window.location.hash)
      else if (isErrorPage) // If using hash and error page, change the hash accordingly
        window.location.hash = _LucidRouter.error.path.substr(1);
    })
  } else {
    // Render the page after checking if page is imported
    renderPage(result.name, result.payload);

    // Push the state after the page is rendered
    if (_LucidRouter.router.use === "history")
      history.replaceState(null, null, isErrorPage ? _LucidRouter.error.path : url + window.location.search + window.location.hash)
    else if (isErrorPage) // If using hash and error page, change the hash accordingly
      window.location.hash = _LucidRouter.error.path.substr(1);
  }
}

/**
 * 
 * @param {string} name Name of the page
 * @param {object} payload Payload of the page
 */
function renderPage(name, payload) {
  // If page doesn't have a skeleton already, create it's skeleton
  if (!_LucidRouter._Lucid.components[name].skeleton) {
    const elem = document.createElement("div");

    // Fix bug with src, if src is set, it will request the src and
    // will fail if it's a string variable (e.g. {{state.photoPath}})
    let elemHTML = _LucidRouter._Lucid.components[name].render();
    elem.innerHTML = elemHTML.replace("src=", "srcName=");

    // Create the skeleton out of the first element node
    const childNodes = Array.from(elem.childNodes);
    for (let i = 0; i < childNodes.length; ++i) {
      if (childNodes[i].nodeType === Node.ELEMENT_NODE) {
        _LucidRouter._Lucid.components[name].skeleton = _LucidRouter._Lucid.createSkeleton(childNodes[i], name);
        break;
      }
    }
  }

  // Remove all elements inside the container before inserting new content into it
  while (_LucidRouter._Lucid.app.container.lastChild)
    _LucidRouter._Lucid.app.container.removeChild(_LucidRouter._Lucid.app.container.lastChild);

  // Call remove function for all connected elements in order to clear buffer and 
  // to call components disconnected hook
  for (const key in _LucidRouter._Lucid.elements) {
    // Seperate the name and key from the element key which looks like this HomePage0 -> HomePage + 0
    let componentName = "";
    let componentKey;
    let i;
    for (i = 0; i < key.length; ++i) {
      if (isNaN(key[i]))
        componentName += key[i]
    }
    componentKey = key.substr(i - 1);

    _LucidRouter._Lucid.app.remove(componentName, componentKey);
  }

  // Save page's state and DOM into lucid for later use
  _LucidRouter._Lucid.elements[name + 0] = {
    state: _LucidRouter._Lucid.components[name].state,
    attributes: null,
    dom: _LucidRouter._Lucid.app.container
  };

  // Check if hooks exist, if exist, then call "created" function if exists
  _LucidRouter._Lucid.components[name].hooks && _LucidRouter._Lucid.components[name].hooks.created && _LucidRouter._Lucid.components[name].hooks.created.call(_LucidRouter._Lucid.getThisParameter(name, 0));

  connectPage(_LucidRouter._Lucid.app.container, _LucidRouter._Lucid.components[name].skeleton);

  // Get this parameter and also put payload into it
  let thisParameter = _LucidRouter._Lucid.getThisParameter(name, 0)
  thisParameter.payload = payload;

  // Check if hooks exist, if exist, then call "connected" function if exists
  _LucidRouter._Lucid.components[name].hooks && _LucidRouter._Lucid.components[name].hooks.connected && _LucidRouter._Lucid.components[name].hooks.connected.call(thisParameter);
}

/**
 * 
 * @param {HTMLElement} dom 
 * @param {Skeleton} skeleton 
 * @returns 
 */
function connectPage(dom, skeleton) {
  // If skeleton is a string, it's a text node that is the only child
  if (typeof skeleton === "string") {
    skeleton = _LucidRouter._Lucid.convertTextVariables(skeleton, _LucidRouter.currentPage, 0);
    const textNode = document.createTextNode(skeleton);
    dom.appendChild(textNode);
    return;
  }

  const elem = document.createElement(skeleton.tag);

  for (const key in skeleton.attrs) {
    if (key.startsWith("on")) {
      elem.addEventListener(key.substr(2), function () {
        skeleton.attrs[key].call(_LucidRouter._Lucid.getThisParameter(_LucidRouter.currentPage, 0));
      });
    }
    else {
      const result = _LucidRouter._Lucid.convertTextVariables(skeleton.attrs[key], _LucidRouter.currentPage, 0)

      // Fix bug with src, if src is set, it will request the src and
      // will fail if it's a string variable (e.g. {{state.photoPath}})
      elem.setAttribute(key === "srcname" ? "src" : key, result);
    }
  }

  // Get 2 lucid attributes, "lucid-component" and "lucid-key"
  const componentName = elem.getAttribute("lucid-component");
  const componentKey = elem.getAttribute("lucid-key");

  // If component name and key are present in the node, it's a lucid component
  if (componentName || componentKey)
    _LucidRouter._Lucid.app.render(elem, componentName, componentKey, null, true);

  for (let i = 0; i < skeleton.children.length; ++i)
    connectPage(elem, skeleton.children[i]);

  dom.appendChild(elem);
}

function to(url) {
  switch (_LucidRouter.router.use) {
    case "hash":
      window.location.hash = url;
      break;
    case "history":
      changePageTo(url);
      break;
  }
}

function forward() {
  window.history.forward();
}

function back() {
  window.history.back();
}

/**
 * 
 * @param {string} url 
 * @returns {RegExp}
 */
function parse(url) {
  return new RegExp("^" + url + "$", "i")
}

function match(url) {
  for (const pageName in _LucidRouter.pages) {
    let match = url.match(_LucidRouter.pages[pageName].regexPath);
    if (match) {
      let payload = [];
      for (let i = 1; i < match.length; ++i)
        payload.push(match[i]);
      return { name: pageName, payload: payload };
    }
  }
}