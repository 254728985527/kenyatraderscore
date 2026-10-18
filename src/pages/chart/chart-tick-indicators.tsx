import { useEffect, useMemo, useRef, useState } from 'react';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';

type Indicator = {
    id: string;
    epoch: number;
    quote: number;
    direction: 'rise' | 'fall' | 'neutral';
    receivedAt: number;
};

const INDICATOR_LIFETIME = 4000;
const PRESERVED_INDICATORS = 3;
const HISTORY_SIZE = 1000;

export default function ChartTickIndicators({ symbol }: { symbol: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const quotesRef = useRef<number[]>([]);
    const previousSymbolRef = useRef(symbol);

    useEffect(() => {
        if (previousSymbolRef.current !== symbol) {
            previousSymbolRef.current = symbol;
            quotesRef.current = [];
            setIndicators([]);
        }

        const stream = chart_api.api?.onMessage?.();
        if (!stream) return undefined;

        const subscription = stream.subscribe(({ data }: { data: any }) => {
            const tick = data?.msg_type === 'tick' ? data.tick : undefined;
            if (!tick || tick.symbol !== symbol) return;

            const quote = Number(tick.quote);
            if (!Number.isFinite(quote)) return;

            const previousQuote = quotesRef.current.at(-1);
            quotesRef.current = [...quotesRef.current.slice(-(HISTORY_SIZE - 1)), quote];
            const direction = previousQuote === undefined || quote === previousQuote
                ? 'neutral'
                : quote > previousQuote ? 'rise' : 'fall';
            const receivedAt = Date.now();

            setIndicators(current => [
                ...current,
                {
                    id: `${tick.epoch}-${receivedAt}`,
                    epoch: Number(tick.epoch),
                    quote,
                    direction,
                    receivedAt,
                },
            ]);
        });

        return () => subscription?.unsubscribe?.();
    }, [symbol]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const cutoff = Date.now() - INDICATOR_LIFETIME;
            setIndicators(current => {
                if (current.length <= PRESERVED_INDICATORS) return current;
                const preservedIds = new Set(current.slice(-PRESERVED_INDICATORS).map(indicator => indicator.id));
                return current.filter(indicator => indicator.receivedAt >= cutoff || preservedIds.has(indicator.id));
            });
        }, 250);

        return () => window.clearInterval(timer);
    }, []);

    const positions = useMemo(() => {
        const width = containerRef.current?.clientWidth ?? 0;
        const height = containerRef.current?.clientHeight ?? 0;
        const values = indicators.map(indicator => indicator.quote);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        return indicators.map((indicator, index) => ({
            ...indicator,
            left: indicators.length === 1 ? width / 2 : (index / (indicators.length - 1)) * width,
            top: height - ((indicator.quote - min) / range) * Math.max(height - 24, 1),
        }));
    }, [indicators]);

    return (
        <div ref={containerRef} className='chart-tick-indicators' aria-hidden='true'>
            {positions.map(indicator => (
                <span
                    className={`chart-tick-indicator chart-tick-indicator--${indicator.direction}`}
                    key={indicator.id}
                    style={{ left: indicator.left, top: indicator.top }}
                >
                    <span className='chart-tick-indicator__core' />
                </span>
            ))}
        </div>
    );
}
