import { lazy } from 'react';
import type { ComponentType } from 'react';

// Registry maps plugin tab IDs to their React components
// When a new plugin is added, register its component here
const tabComponents: Record<string, ComponentType> = {};

// Built-in plugin tab registrations
try {
  const CatalogTab = lazy(() => import('./catalog/CatalogTab'));
  tabComponents['catalog'] = CatalogTab;
} catch { }

try {
  const DigitalResourcesTab = lazy(() => import('./digital-resources/DigitalResourcesTab'));
  tabComponents['digital-resources'] = DigitalResourcesTab;
} catch { }

try {
  const CirculationTab = lazy(() => import('./native-catalog/CirculationTab'));
  const HoldsTab = lazy(() => import('./native-catalog/HoldsTab'));
  tabComponents['circulation'] = CirculationTab;
  tabComponents['holds'] = HoldsTab;
} catch { }

try {
  const PatronsTab = lazy(() => import('./patrons/PatronsTab'));
  tabComponents['patrons'] = PatronsTab;
} catch { }

try {
  const ExhibitsTab = lazy(() => import('./exhibits/ExhibitsTab'));
  tabComponents['exhibits'] = ExhibitsTab;
} catch { }

export function registerPluginTab(id: string, component: ComponentType) {
  tabComponents[id] = component;
}

export function getPluginTabComponent(id: string): ComponentType | null {
  return tabComponents[id] || null;
}

export function getRegisteredTabIds(): string[] {
  return Object.keys(tabComponents);
}
