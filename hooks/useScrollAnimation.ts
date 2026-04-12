import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Lightweight scroll tracking hook.
 * Returns a ref-based onScroll handler plus a getter for current scroll offset.
 * Designed for use with Moti scroll-triggered entrance animations.
 */
export function useScrollAnimation() {
  const scrollY = useRef(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    []
  );

  const getScrollY = useCallback(() => scrollY.current, []);

  return { onScroll, getScrollY, scrollY };
}
