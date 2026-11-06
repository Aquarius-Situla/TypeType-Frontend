import { type ComponentType, useEffect, useState } from "react";
import type { PreloadableComponent } from "../lib/preloadable-lazy";

/**
 * A lazy component behind Suspense commits up to 300 ms late once its module resolves, React
 * throttling the swap from the fallback. Rendering a placeholder until the module is loaded and
 * then the component itself swaps at once. A load failure renders the lazy component, whose error
 * reaches the nearest error boundary as before.
 */
export function useLoadedComponent<P extends object>(
  component: PreloadableComponent<P>,
): ComponentType<P> | null {
  const [loaded, setLoaded] = useState<ComponentType<P> | null>(() => component.loaded());

  useEffect(() => {
    if (loaded) return;
    let active = true;
    component.preload().then(
      (resolved) => {
        if (active) setLoaded(() => resolved);
      },
      () => {
        if (active) setLoaded(() => component.current() as ComponentType<P>);
      },
    );
    return () => {
      active = false;
    };
  }, [component, loaded]);

  return loaded;
}
