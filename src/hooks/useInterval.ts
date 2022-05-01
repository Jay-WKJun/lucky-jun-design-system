import { useRef, useEffect } from 'react';

type Callback = () => unknown;

function useInterval(callback: Callback, interval: number, dependency?: unknown) {
  const timer = useRef<ReturnType<typeof setInterval>>();
  const callbackRef = useRef<Callback>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (callbackRef.current) callbackRef.current();
    }

    timer.current = setInterval(() => {
      tick();
    }, interval);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [interval, dependency]);
}

export default useInterval;
