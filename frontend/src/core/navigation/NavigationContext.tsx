import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../../api';

export type NavItem = {
  id: number;
  label: string;
  type: string;
  value?: string;
  target?: string;
  parentId?: number;
  sortOrder: number;
  isVisible: boolean;
  area: string;
  children: NavItem[];
};

type NavigationContextType = {
  navItems: NavItem[];
  loading: boolean;
  refresh: () => void;
};

const NavigationContext = createContext<NavigationContextType>({
  navItems: [],
  loading: true,
  refresh: () => {},
});

export function resolveHref(item: NavItem): string {
  switch (item.type) {
    case 'page': return `/${item.value}`;
    case 'collection': return `/collections/${item.value}`;
    case 'events': return '/events';
    case 'staff': return '/staff';
    case 'digital_resources': return '/resources';
    case 'anchor': return `#${item.value}`;
    case 'url': return item.value || '/';
    default: return item.value || '/';
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/navigation/public')
      .then(res => setNavItems(res.data))
      .catch(() => setNavItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <NavigationContext.Provider value={{ navItems, loading, refresh: load }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
