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
    const parsedPath = parse(pages[i].path);
    _LucidRouter.pages[pages[i].name] = {
      path: pages[i].path,
      source: pages[i].source,
      regexPath: parsedPath.regexPath,
      properties: parsedPath.properties
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
      // Get the current url from hash location
      let url = "/" + window.location.hash.substr(1);

      // If url is not set to any sub-path, set it to base path
      if (url === "/") {
        url = _LucidRouter.basePath;
        window.location.hash = url.substr(1);
      }

      // Match the url with existing pages, if there are no matches, render the error page
      const result = match(url);
      if (!result) {
        // If there is no error page to render, return
        if (!_LucidRouter.error)
          return;

        return;
      }

      // Set the current page's name to currentPage for later use
      _LucidRouter.currentPage = result.name;

      if (typeof _LucidRouter.pages[result.name].source === "string") {
        import(_LucidRouter.pages[result.name].source).then((module) => {
          _LucidRouter.pages[result.name].source = module.default;

          // Declare the page inside lucid, since a page in it's origin, still a component
          _LucidRouter._Lucid.components[result.name] = {
            name: result.name,
            state: _LucidRouter.pages[result.name].source.state,
            methods: _LucidRouter.pages[result.name].source.methods,
            render: _LucidRouter.pages[result.name].source.render,
            hooks: _LucidRouter.pages[result.name].source.hooks,
            attributes: _LucidRouter.pages[result.name].source.attributes,
            watch: _LucidRouter.pages[result.name].source.watch,
            skeleton: null
          };

          for (let i = 0; i < _LucidRouter.pages[result.name].source.components.length; ++i) {
            // Get the component into a single variable, it's easier to work with :)
            const component = _LucidRouter.pages[result.name].source.components[i];

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
          console.log(_LucidRouter);
          // Render the page after the import
          renderPage(result.name, result.payload);
        })
      } else {
        // Render the page after checking if page is imported
        renderPage(result.name, result.payload);
      }


      break;
    case "history":
      break;
  }

  //for (const pageName in _LucidRouter.pages) {
  //  if (typeof _LucidRouter.pages[pageName].source === "string") {
  //    import(_LucidRouter.pages[pageName].source).then((module) => {
  //      _LucidRouter.pages[pageName].source = module.default
  //      for (let i = 0; i < _LucidRouter.pages[pageName].source.components.length; ++i) {
  //        const name = _LucidRouter.pages[pageName].source.components[i].name;
  //        _LucidRouter._Lucid.components[name] = _LucidRouter.pages[pageName].source.components[i];
  //      }
  //    })
  //  }
  //}
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
    elem.innerHTML = _LucidRouter.pages[name].source.render();

    // Create the skeleton out of the first element node
    const childNodes = Array.from(elem.childNodes);
    for (let i = 0; i < childNodes.length; ++i) {
      if (childNodes[i].nodeType === Node.ELEMENT_NODE) {
        _LucidRouter._Lucid.components[name].skeleton = _LucidRouter._Lucid.createSkeleton(childNodes[i]);

        break;
      }
    }
  }

  // Remove all elements inside the container before inserting new content into it
  while (_LucidRouter._Lucid.app.container.lastChild)
    _LucidRouter._Lucid.app.container.removeChild(_LucidRouter._Lucid.app.container.lastChild);

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

function connectPage(dom, skeleton) {
  // If skeleton is a string, it's a text node that is the only child
  if (typeof skeleton === "string") {
    skeleton = _LucidRouter._Lucid.convertTextVariables(skeleton, _LucidRouter.currentPage, 0);
    const textNode = document.createTextNode(skeleton);
    dom.appendChild(textNode);
    return;
  }

  const elem = document.createElement(skeleton.tag);

  for (const key in skeleton.attrs)
    elem.setAttribute(key, skeleton.attrs[key]);

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

function to() {

}

function forward() {

}

function back() {

}

/**
 * 
 * @param {string} url 
 * @returns {{regexPath: RegExp, properties: string[]}}
 */
function parse(url) {
  return {
    regexPath: new RegExp("^" + url + "$", "i")
  };
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

///**
// * 
// * @param {object} properties
// * @param {('history' | 'hash')} properties.use 
// * @param {} properties.pages
// */
//function create(properties) {
//  for (const key in properties.pages) {
//    properties.pages[key].regexPath = pathToRegex(properties.pages[key].path);
//    properties.pages[key].name = key;
//  }//

//  _LucidRouter.router.use = properties.use;
//  _LucidRouter.router.pages = properties.pages;//

//  return _LucidRouter.router;
//}//

///**
// * 
// * @param {string} path 
// */
//function pathToRegex(path) {
//  return new RegExp("^" + path + "$", "i");
//}//

///**
// * 
// * @param {} lucid 
// */
//function linkLucid(lucid) {
//  _LucidRouter._Lucid = lucid;//

//  switch (_LucidRouter.router.use) {
//    case "hash":
//      //window.location.href = "#" + _LucidRouter._Lucid.app.page.path.substr(1);//

//      const url = "/" + window.location.hash.substr(1);
//      if (url !== "/") {
//        const page = changePage(url);//

//        _LucidRouter._Lucid.app.page = _LucidRouter.router.pages[page.name];
//        _LucidRouter._Lucid.app.page.payload = page.payload;
//      }//

//      window.addEventListener("hashchange", (e) => {
//        e.preventDefault();//

//        // Check if hashchange should be ignored
//        if (_LucidRouter.ignoreHashChange) {
//          _LucidRouter.ignoreHashChange = false;
//          return;
//        }//

//        const url = "/" + window.location.hash.substr(1);
//        const page = changePage(url);//

//        // Check if hooks exist, if exist, then call "disconnected" function if exists
//        _LucidRouter._Lucid.app.page.hooks && _LucidRouter._Lucid.app.page.hooks.connected && _LucidRouter._Lucid.app.page.hooks.disconnected();//

//        // Change the current page, set the payload of the page then render the page
//        _LucidRouter._Lucid.app.page = _LucidRouter.router.pages[page.name];
//        _LucidRouter._Lucid.app.page.payload = page.payload;
//        _LucidRouter._Lucid.renderPage();
//      });
//      break;
//    case "history":
//      break;
//  }
//}//

///**
// * 
// * @param {string} url 
// * @returns {{name: string, payload: string[]}}
// */
//function to(url) {
//  switch (_LucidRouter.router.use) {
//    case "hash":
//      _LucidRouter.ignoreHashChange = true;
//      window.location.href = "#" + url.substr(1);
//      return changePage(url);
//    case "history":
//      history.pushState(null, null, url);
//      break;
//  }
//}//

///**
// * 
// * @param {string} url 
// * @returns {{name: string, payload: string[]}}
// */
//function changePage(url) {
//  for (const pageName in _LucidRouter.router.pages) {
//    let match = url.match(_LucidRouter.router.pages[pageName].regexPath);
//    if (match) {
//      let payload = [];
//      for (let i = 1; i < match.length; ++i)
//        payload.push(match[i]);
//      return { name: pageName, payload: payload };
//    }
//  }
//}