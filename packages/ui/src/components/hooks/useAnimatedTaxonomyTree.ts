import { useEffect, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { layoutTaxonomyTree } from '../../utils/taxonomyTree';
import { createTreeTransition, getTreeAnimationFrame } from '../../utils/taxonomyTreeAnimation';

export const useAnimatedTaxonomyTree = (layout: ReturnType<typeof layoutTaxonomyTree>) => {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [frame, setFrame] = useState(() => getTreeAnimationFrame(layout));
  const current = useRef(frame);

  useEffect(() => {
    const publish = (next: typeof frame) => {
      current.current = next;
      setFrame(next);
    };
    if (reducedMotion) {
      publish(getTreeAnimationFrame(layout));
      return;
    }
    const sample = createTreeTransition(current.current, layout);
    let request: number;
    let started: number | undefined;
    const tick = (time: number) => {
      started ??= time;
      const progress = Math.min(1, (time - started) / 220);
      publish(sample(progress));
      if (progress < 1) request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [layout, reducedMotion]);

  return reducedMotion ? getTreeAnimationFrame(layout) : frame;
};
