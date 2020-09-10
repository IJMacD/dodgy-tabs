import React from 'react';
import './App.css';

const builtinIcons = [ "default", "play",  "stop",  "question",  "redx",  "music",  "touyube" ];
const defaultTitle = document.title;
const defaultIcon = builtinIcons[0];

function getIcon (savedIcons, icon) {
  if (icon in savedIcons) return savedIcons[icon];
  return require("./icons/" + icon + ".png");
}

function App() {
  const [ title, setTitle ] = React.useState(() => {
    const query = getHashQuery();
    return (query && query.get("title")) || defaultTitle;
  });
  const [ icon, setIcon ] = React.useState(() => {
    const query = getHashQuery();
    return (query && query.get("icon")) || defaultIcon;
  });
  const setShortcutIcon = useShortcutIcon();
  const [ adding, setAdding ] = React.useState(false);
  const [ addIconValue, setAddIconValue ] = React.useState("");
  const [ savedIcons, setSavedIcons ] = useSavedState("dodgy-tabs-icons", {});

  React.useEffect(() => {
    document.title = title;
  }, [ title ]);

  React.useEffect(() => {
    setShortcutIcon(getIcon(savedIcons, icon));
  }, [ savedIcons, setShortcutIcon, icon ]);

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

  React.useEffect(() => {
    const callback = e => {
      if (!(e.target instanceof HTMLInputElement) && e.key === "Delete") {
        setIcon(defaultIcon);
        const newObj = { ...savedIcons };
        delete newObj[icon];
        setSavedIcons(newObj);
      }
    };
    document.addEventListener("keyup", callback);

    return () => document.removeEventListener("keyup", callback);
  }, [ savedIcons, setSavedIcons, setIcon, icon ]);

  function addIcon (url) {
    setAdding(false);
    setAddIconValue("");
    const id = Math.floor(Math.random() * 1e6).toString(36);
    setSavedIcons({ ...savedIcons, [id]: url });
  }

  const icons = [ ...builtinIcons, ...Object.keys(savedIcons) ];

  return (
    <div className="App">
      <header className="App-header">
        <input className="tab-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <ul className="icon-picker">
          {
            icons.map(key => {
              const url = getIcon(savedIcons, key);
              return (
                <li key={key} className={`${key === icon ? "selected" : ""}`} onClick={() => setIcon(key)}>
                  <img src={url} />
                </li>
              );
            })
          }
        </ul>
        {
          adding ?
            <form className="new-icon-form" onSubmit={e => { e.preventDefault(); addIcon(addIconValue); }}>
              <input value={addIconValue} onChange={e => setAddIconValue(e.target.value)} placeholder="https://" autoFocus />
              <button>Add</button>
            </form>
            :
            <button className="add-button" onClick={() => setAdding(true)}>New Icon</button>
        }
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

/**
 * @param {string} key
 * @param {any} initialState
 */
function useSavedState (key, initialState) {
  function loadSavedState () {
    const saved = localStorage.getItem(key);
    if (!saved) return initialState;
    try {
      return JSON.parse(saved);
    } catch (_) {
      return initialState;
    }
  }

  const [ state, setState ] = React.useState(loadSavedState);

  React.useEffect(() => {
    const listener = () => setState(loadSavedState());
    window.addEventListener("storage", listener);

    return () => window.removeEventListener("storage", listener);
  }, []);

  return [
    state,
    newState => {
      localStorage.setItem(key, JSON.stringify(newState));
      setState(newState);
    }
  ];
}