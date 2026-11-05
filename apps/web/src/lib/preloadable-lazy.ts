import { type ComponentType, type LazyExoticComponent, lazy } from "react";

export type PreloadableComponent<P extends object> = {
  current: () => ComponentType<P> | LazyExoticComponent<ComponentType<P>>;
  preload: () => Promise<ComponentType<P>>;
};

export function preloadableLazy<P extends object>(
  load: () => Promise<ComponentType<P>>,
): PreloadableComponent<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  const preload = () => {
    pending ??= load().then((component) => {
      loaded = component;
      return component;
    });
    return pending;
  };
  const Lazy = lazy(() => preload().then((component) => ({ default: component })));
  // React remounts a subtree whose component type changes: the first answer has to stay.
  let chosen: ComponentType<P> | LazyExoticComponent<ComponentType<P>> | null = null;
  return { current: () => (chosen ??= loaded ?? Lazy), preload };
}
