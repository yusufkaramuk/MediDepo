import { useState, useEffect, useCallback } from 'react';

// Hash tabanlı sekme yönlendirmesi.
// Ana uygulama path tabanlı rotaları ( /share/, /gizlilik, /kosullar )
// etkilemeden #/sekme biçimini kullanır. Örnekler:
//   #/anasayfa (varsayılan) · #/ilaclar · #/ilaclar?filtre=yaklasan
//
// NOT: /share/ rotasında hash şifreleme anahtarı taşır; bu hook yalnızca
// ana uygulamada (share dışı) mount edilir.

export const TABS = ['anasayfa', 'ilaclar'];

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const tab = TABS.includes(pathPart) ? pathPart : 'anasayfa';
  const params = new URLSearchParams(queryPart || '');
  return { tab, params };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((tab, params) => {
    const safeTab = TABS.includes(tab) ? tab : 'anasayfa';
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    const next = `#/${safeTab}${qs}`;
    if (window.location.hash !== next) {
      window.location.hash = next;
    } else {
      setRoute(parseHash(next));
    }
  }, []);

  return { tab: route.tab, params: route.params, navigate };
}
