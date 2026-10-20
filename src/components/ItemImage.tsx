import { useEffect, useState } from 'react';
import { getImageUrl } from '../lib/images';

/** An uploaded image from IndexedDB, or nothing while it loads / if it is gone. */
export function ItemImage({ id, className }: { id: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void getImageUrl(id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id]);
  return url ? <img src={url} alt="" className={className} /> : null;
}
