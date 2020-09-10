import React from 'react';
import './App.css';

const builtinIcons = [ "default", "play",  "stop",  "question",  "redx",  "music",  "touyube" ];
const defaultTitle = document.title;
const defaultIcon = builtinIcons[0];

function getIcon (icon) {
  return require("./icons/" + icon + ".png");
}

function App() {
  const [ title, setTitle ] = React.useState(() => {
    const query = getHashQuery();
    return query && query.get("title") || defaultTitle;
  });
  const [ icon, setIcon ] = React.useState(() => {
    const query = getHashQuery();
    return query && query.get("icon") || defaultIcon;
  });
  const setShortcutIcon = useShortcutIcon();

  React.useEffect(() => {
    document.title = title;
  }, [ title ]);

  React.useEffect(() => {
    setShortcutIcon(getIcon(icon));
  }, [ icon ]);

  useDebouncedEffect(() => {
    const params = new URLSearchParams();
    title && title !== defaultTitle && params.set("title", title);
    icon && icon !== defaultIcon && params.set("icon", icon);
    window.location.hash = params.toString();
  }, [ title, icon ], 2000);

  useHashListener(() => {
    const query = getHashQuery();
    const title = query && query.get("title");
    title && setTitle(title);
    const icon = query && query.get("icon");
    icon && setIcon(icon);
  });

  return (
    <div className="App">
      <header className="App-header">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <ul className="icon-picker">
          {
            builtinIcons.map(key => {
              const url = getIcon(key);
              return (
                <li key={key} className={`${key === icon ? "selected" : ""}`} onClick={() => setIcon(key)}>
                  <img src={url} />
                </li>
              );
            })
          }
        </ul>
      </header>
    </div>
  );
}

export default App;

function useShortcutIcon () {
  /** @type {React.MutableRefObject<HTMLLinkElement>} */
  const ref = React.useRef();

  if (!ref.current) {
    ref.current = document.createElement("link");
    ref.current.rel = "shortcut icon";
    document.head.append(ref.current);
  }

  return href => ref.current.href = href;
}

function getHashQuery () {
  if (window.location.hash.length <= 1) {
    return null;
  }
  return new URLSearchParams(window.location.hash.substr(1));
}

/**
 * @param {() => void} fn
 * @param {React.DependencyList} dependencies
 * @param {number} timeout
 */
function useDebouncedEffect (fn, dependencies, timeout) {
  /** @type {React.MutableRefObject<NodeJS.Timeout>} */
  const ref = React.useRef();

  React.useEffect(() => {
    if (ref.current) {
      clearInterval(ref.current);
    }

    ref.current = setTimeout(() => {
      fn();
      ref.current = null;
    }, timeout);

  }, dependencies);
}

/**
 * @param {() => void} fn
 */
function useHashListener (fn) {
  const ref = React.useRef(fn);

  ref.current = fn;

  React.useEffect(() => {
    const callback = () => ref.current();

    window.addEventListener("hashchange", callback);

    return () => window.removeEventListener("hashchange", callback);
  }, []);
}