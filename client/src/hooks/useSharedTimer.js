import { useState, useEffect } from 'react';

let sharedNow = new Date();
const listeners = new Set();
let timerId = null;

function tick() {
  sharedNow = new Date();
  listeners.forEach((listener) => listener(sharedNow));
}

function startTimer() {
  if (timerId === null) {
    timerId = setInterval(tick, 60000);
  }
}

function stopTimer() {
  if (listeners.size === 0 && timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

/**
 * Hook providing a single shared 60-second interval clock across all subscribers.
 */
export function useSharedTimer() {
  const [now, setNow] = useState(sharedNow);

  useEffect(() => {
    listeners.add(setNow);
    startTimer();
    return () => {
      listeners.delete(setNow);
      stopTimer();
    };
  }, []);

  return now;
}

export default useSharedTimer;
