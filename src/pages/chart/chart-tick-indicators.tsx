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
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
    const quotesRef = useRef<{ epoch: number; quote: number }[]>([]);
    const previousSymbolRef = useRef(symbol);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return undefined;

        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            setChartSize({ width: rect.width, height: rect.height });
        };
        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, []);

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

            const previousQuote = quotesRef.current.at(-1)?.quote;
            quotesRef.current = [
                ...quotesRef.current.slice(-(HISTORY_SIZE - 1)),
                { epoch: Number(tick.epoch), quote },
            ];
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
        const history = quotesRef.current;
        if (!history.length || !chartSize.width || !chartSize.height) return [];

        const values = history.map(tick => tick.quote);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const plotHeight = Math.max(chartSize.height - 24, 1);
        const lastIndex = history.length - 1;

        return indicators.map(indicator => {
            const tickIndex = history.findLastIndex(tick => tick.epoch === indicator.epoch && tick.quote === indicator.quote);
            const index = tickIndex < 0 ? lastIndex : tickIndex;
            return {
                ...indicator,
                left: (index / Math.max(lastIndex, 1)) * chartSize.width,
                top: chartSize.height - ((indicator.quote - min) / range) * plotHeight,
            };
        });
    }, [indicators, chartSize]);

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
