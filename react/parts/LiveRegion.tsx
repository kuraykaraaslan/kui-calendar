import { useEffect, useState } from 'react';

type LiveRegionProps = {
  message: string;
};

export function LiveRegion({ message }: LiveRegionProps) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [alt, setAlt] = useState(false);

  useEffect(() => {
    if (!message) return;
    if (alt) { setB(message); setAlt(false); }
    else { setA(message); setAlt(true); }
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{a}</div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{b}</div>
    </>
  );
}
