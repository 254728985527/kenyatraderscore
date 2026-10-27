'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import TicksService from '@/external/bot-skeleton/services/api/ticks_service';
import './ai-volatility-scanner.scss';

type TradeType = 'OVER 2' | 'UNDER 7' | 'EVEN' | 'ODD';
type Status = 'WAITING' | 'QUALIFIED' | 'LOADING' | 'ACTIVE' | 'ERROR';
type Market = { symbol: string; label: string; speed: string; digits: number[]; lastTick: number; updatedAt: number; error?: boolean };

type ScanResult = Market & { percentage: number; score: number; sampleSize: number; status: Status };

const MARKETS = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
const TYPES: TradeType[] = ['OVER 2', 'UNDER 7', 'EVEN', 'ODD'];
const threshold = 55;

const digitOf = (quote: number) => Number(String(quote).replace('.', '').slice(-1));
const qualifies = (type: TradeType, digit: number) => ({
    'OVER 2': digit > 2,
    'UNDER 7': digit < 7,
    EVEN: digit % 2 === 0,
    ODD: digit % 2 !== 0,
}[type]);
const tradeConfig = (type: TradeType) => ({
    'OVER 2': { tradetype: 'DIGITOVER', prediction: '2' },
    'UNDER 7': { tradetype: 'DIGITUNDER', prediction: '7' },
    EVEN: { tradetype: 'DIGITEVEN', prediction: '' },
    ODD: { tradetype: 'DIGITODD', prediction: '' },
}[type]);

const AIVolatilityScanner = observer(() => {
    const { quick_strategy } = useStore();
    const [markets, setMarkets] = React.useState<Record<string, Market>>({});
    const [states, setStates] = React.useState<Record<TradeType, Status>>({ 'OVER 2': 'WAITING', 'UNDER 7': 'WAITING', EVEN: 'WAITING', ODD: 'WAITING' });
    const [analysisWindow, setAnalysisWindow] = React.useState(120);
    const [isOpen, setIsOpen] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 24, y: 92 });
    const dragRef = React.useRef<{ offsetX: number; offsetY: number; moved: boolean } | null>(null);
    const serviceRef = React.useRef<TicksService | null>(null);

    React.useEffect(() => {
        const service = new TicksService();
        serviceRef.current = service;
        let cancelled = false;
        const subscribe = async (symbol: string) => {
            try {
                const ticks = await service.request({ symbol });
                if (!cancelled) setMarkets(current => ({ ...current, [symbol]: { symbol, label: symbol.replace('1HZ', '1s '), speed: symbol.startsWith('1HZ') ? '1-second' : 'standard', digits: ticks.slice(-analysisWindow).map((tick: { quote: number }) => digitOf(tick.quote)), lastTick: ticks.at(-1)?.quote ?? 0, updatedAt: Date.now() } }));
                await service.monitor({ symbol, callback: (nextTicks: { quote: number }[]) => {
                    if (!cancelled) setMarkets(current => ({ ...current, [symbol]: { ...(current[symbol] ?? { symbol, label: symbol, speed: symbol.startsWith('1HZ') ? '1-second' : 'standard', digits: [] }), digits: nextTicks.slice(-analysisWindow).map(tick => digitOf(tick.quote)), lastTick: nextTicks.at(-1)?.quote ?? 0, updatedAt: Date.now() } }));
                } });
            } catch { if (!cancelled) setMarkets(current => ({ ...current, [symbol]: { symbol, label: symbol, speed: symbol.startsWith('1HZ') ? '1-second' : 'standard', digits: [], lastTick: 0, updatedAt: Date.now(), error: true } })); }
        };
        MARKETS.forEach(subscribe);
        return () => { cancelled = true; void service.unsubscribeFromTicksService(); };
    }, [analysisWindow]);

    const results = React.useMemo(() => Object.fromEntries(TYPES.map(type => {
        const candidates = Object.values(markets).map(market => {
            const sampleSize = market.digits.length;
            const percentage = sampleSize ? (market.digits.filter(digit => qualifies(type, digit)).length / sampleSize) * 100 : 0;
            const freshness = Date.now() - market.updatedAt < 15000;
            const status: Status = sampleSize >= 20 && freshness && !market.error && percentage >= threshold ? 'QUALIFIED' : 'WAITING';
            return { ...market, percentage, score: Math.round(percentage * Math.min(sampleSize / analysisWindow, 1) * 100) / 100, sampleSize, status } as ScanResult;
        }).filter(item => item.status === 'QUALIFIED').sort((a, b) => b.score - a.score);
        return [type, candidates[0] ?? null];
    })), [markets, analysisWindow]) as Record<TradeType, ScanResult | null>;

    const loadBot = async (type: TradeType) => {
        const result = results[type];
        if (!result) return;
        setStates(current => ({ ...current, [type]: 'LOADING' }));
        try {
            const config = tradeConfig(type);
            await quick_strategy.onSubmit({ symbol: result.symbol, tradetype: config.tradetype, prediction: config.prediction, type: 'both', duration: 1, durationtype: 't', stake: 1, action: 'RUN' });
            setStates(current => ({ ...current, [type]: 'ACTIVE' }));
        } catch { setStates(current => ({ ...current, [type]: 'ERROR' })); }
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!dragRef.current) return;
        dragRef.current.moved = true;
        setPosition({
            x: Math.max(8, Math.min(window.innerWidth - 76, event.clientX - dragRef.current.offsetX)),
            y: Math.max(56, Math.min(window.innerHeight - 76, event.clientY - dragRef.current.offsetY)),
        });
    };

    const handlePointerUp = () => { dragRef.current = null; };

    return <>
        <button
            className='ai-scanner-orb'
            style={{ left: position.x, top: position.y }}
            aria-label='Open AI volatility scanner'
            onClick={() => { if (!dragRef.current?.moved) setIsOpen(open => !open); }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <img src='https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-jexxzNwVYImWACTCn5iR0CvoZbUa2T.png' alt='' />
        </button>
        {isOpen && <section className='ai-scanner' aria-labelledby='ai-scanner-title'>
        <button className='ai-scanner__close' aria-label='Close AI volatility scanner' onClick={() => setIsOpen(false)}>×</button>
        <div className='ai-scanner__header'><div><span className='ai-scanner__eyebrow'>LIVE STATISTICAL ENGINE</span><h2 id='ai-scanner-title'>AI Volatility Scanner</h2><p>Transparent digit analysis of live tick streams. This is statistical ranking, not quantum computing or a guaranteed prediction.</p></div><label className='ai-scanner__window'>Window<select value={analysisWindow} onChange={event => setAnalysisWindow(Number(event.target.value))}><option value='60'>60 ticks</option><option value='120'>120 ticks</option><option value='240'>240 ticks</option></select></label></div>
        <div className='ai-scanner__grid'>{TYPES.map(type => { const result = results[type]; const state = states[type] ?? 'WAITING'; return <article className='ai-scanner__card' key={type}><div className='ai-scanner__card-top'><span className='ai-scanner__type'>{type}</span><span className={`ai-scanner__status ai-scanner__status--${state.toLowerCase()}`}>{state}</span></div>{result ? <><strong className='ai-scanner__market'>{result.label}</strong><div className='ai-scanner__metrics'><span><b>{result.percentage.toFixed(1)}%</b> observed</span><span><b>{result.sampleSize}</b> ticks</span><span><b>{result.score.toFixed(1)}</b> score</span></div><div className='ai-scanner__meta'>Last digit {result.digits.at(-1)} · {result.speed} · updated {Math.max(0, Math.round((Date.now() - result.updatedAt) / 1000))}s ago</div></> : <div className='ai-scanner__empty'>NO QUALIFIED MARKET<span>Waiting for fresh data above {threshold}%</span></div>}<button className='ai-scanner__load' disabled={!result || state === 'LOADING' || state === 'ACTIVE'} onClick={() => loadBot(type)}>{state === 'LOADING' ? 'LOADING…' : state === 'ACTIVE' ? 'ACTIVE' : 'LOAD BOT'}</button></article>; })}</div>
        </section>}
    </>;
});

export default AIVolatilityScanner;
