'use client';

import { useEffect, useState } from 'react';
import { initDB } from '@/lib/moments-db';
import type { Moment, MomentDocument } from '@/types/moment';
import { calculateDayDifference } from '@/lib/date-utils';

export function useMomentsDB() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const db = await initDB();

        // Reactive query
        const observable = db.moments.find({
          selector: {},
          sort: [{ createdAt: 'desc' }],
        }).$;

        subscription = observable.subscribe((docs: MomentDocument[]) => {
          const processed = docs.map((doc: MomentDocument & { toJSON?: () => MomentDocument }) => {
            const data = doc.toJSON ? doc.toJSON() : doc;
            const calculation = calculateDayDifference(data.date, data.repeatFrequency);
            return {
              ...data,
              ...calculation,
              isRepeating: data.repeatFrequency !== 'none',
            } as Moment;
          });
          setMoments(processed);
        });
      } catch (err: unknown) {
        console.error('DB init failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize DB');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return { moments, loading, error, setMoments };
}
