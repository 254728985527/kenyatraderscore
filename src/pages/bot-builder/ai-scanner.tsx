import React from 'react';
import { useSmartChartAdaptor } from '@/hooks/useSmartChartAdaptor';
import './ai-scanner.scss';

type TradeType = 'OVER 2' | 'UNDER 7' | 'EVEN' | 'ODD';
type ScannerRow = { type: TradeType; symbol: string; percent: number; sample: number; lastDigit: number | null; updated: number; qualified: boolean; score: number };

const SYMBOLS = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V', '1HZ150V', '1HZ200V', '1HZ250V', '1HZ300V'];
const TRADE_TYPES: TradeType[] = ['OVER 2', 'UNDER 7', 'EVEN', 'ODD'];
const WINDOW_SIZE = 20;

const metric = (type: TradeType, digit: number) => {
    if (type === 'OVER 2') return digit > 2;
    if (type === 'UNDER 7') return digit < 7;
    if (type === 'EVEN') return digit % 2 === 0;
    return digit % 2 === 1;
};

const marketName = (symbol: string) => symbol.startsWith('1HZ') ? `${symbol.replace('1HZ', 'Volatility ')} (1s)` : symbol.replace('R_', 'Volatility ');

const AIQualityBadge = () => <span className='ai-scanner__badge'>STATISTICAL AI</span>;

const AIScanner = () => {
    const { adapterInitialized, subscribeQuotes } = useSmartChartAdaptor();
    const [digits, setDigits] = React.useState<Record<string, number[]>>({});
    const [rows, setRows] = React.useState<ScannerRow[]>([]);
    const [activeType, setActiveType] = React.useState<TradeType | null>(null);
    const [drag, setDrag] = React.useState({ x: 20, y: 84 });
    const dragRef = React.useRef<{ offsetX: number; offsetY: number } | null>(null);

    React.useEffect(() => {
        if (!adapterInitialized) return;
        const unsubs = SYMBOLS.map(symbol => subscribeQuotes({ symbol, granularity: 0 }, quote => {
            const value = Number((quote as any)?.close ?? (quote as any)?.Close ?? (quote as any)?.quote);
            if (!Number.isFinite(value)) return;
            const digit = Number(String(value).replace('.', '').slice(-1));
            setDigits(previous => ({ ...previous, [symbol]: [...(previous[symbol] ?? []), digit].slice(-WINDOW_SIZE) }));
        }));
        return () => unsubs.forEach(unsubscribe => unsubscribe());
    }, [adapterInitialized, subscribeQuotes]);

    React.useEffect(() => {
        const nextRows = TRADE_TYPES.map(type => {
            const candidates = SYMBOLS.map(symbol => {
                const sample = digits[symbol] ?? [];
                const percent = sample.length ? sample.filter(digit => metric(type, digit)).length / sample.length * 100 : 0;
                const qualified = sample.length >= 5 && percent >= 55;
                return { type, symbol, percent, sample: sample.length, lastDigit: sample.at(-1) ?? null, updated: Date.now(), qualified, score: qualified ? percent + Math.min(sample.length, WINDOW_SIZE) / 10 : 0 };
            });
            return candidates.sort((a, b) => b.score - a.score)[0] ?? { type, symbol: '', percent: 0, sample: 0, lastDigit: null, updated: Date.now(), qualified: false, score: 0 };
        });
        setRows(nextRows);
    }, [digits]);

    const loadBot = (row: ScannerRow) => {
        if (!row.qualified || !row.symbol) return;
        setActiveType(row.type);
        const workspace = (window as any).Blockly?.derivWorkspace;
        const root = workspace?.getTopBlocks?.(false)?.find((block: any) => block.type === 'trade_definition');
        const market = root?.getChildByType?.('trade_definition_market');
        const trade = root?.getChildByType?.('trade_definition_tradetype');
        market?.getField?.('SYMBOL_LIST')?.setValue(row.symbol);
        trade?.getField?.('TRADETYPECAT_LIST')?.setValue('digits');
        trade?.getField?.('TRADETYPE_LIST')?.setValue(row.type === 'OVER 2' ? 'over' : row.type === 'UNDER 7' ? 'under' : row.type.toLowerCase());
        window.setTimeout(() => document.querySelector<HTMLElement>('#db-animation__run-button')?.click(), 120);
    };

    const onPointerMove = (event: React.PointerEvent) => {
        if (!dragRef.current) return;
        setDrag({ x: Math.max(8, event.clientX - dragRef.current.offsetX), y: Math.max(8, event.clientY - dragRef.current.offsetY) });
    };

    return <aside className='ai-scanner' style={{ left: drag.x, top: drag.y }} onPointerMove={onPointerMove} onPointerUp={() => { dragRef.current = null; }}>
        <header className='ai-scanner__header' onPointerDown={event => { dragRef.current = { offsetX: event.clientX - drag.x, offsetY: event.clientY - drag.y }; }}>
            <div className='ai-scanner__orb'>AI<span /></div>
            <div><strong>AI Volatility Scanner</strong><small>Live 20-digit statistical analysis</small></div>
            <AIQualityBadge />
        </header>
        <div className='ai-scanner__notice'>No quantum service connected. Rankings use transparent live digit statistics and never guarantee outcomes.</div>
        <div className='ai-scanner__table' role='table' aria-label='AI volatility scanner results'>
            {rows.map(row => <div className='ai-scanner__row' key={row.type}>
                <div><strong>{row.type}</strong><small>{row.sample}/{WINDOW_SIZE} digits · {row.symbol ? marketName(row.symbol) : 'Waiting for live data'}</small></div>
                <div className='ai-scanner__metric'><strong>{row.percent.toFixed(1)}%</strong><small>score {row.score.toFixed(1)}</small></div>
                <span className={row.qualified ? 'ai-scanner__status is-qualified' : 'ai-scanner__status'}>{row.qualified ? 'QUALIFIED' : 'WAITING'}</span>
                <button type='button' disabled={!row.qualified} onClick={() => loadBot(row)}>{activeType === row.type ? 'ACTIVE' : 'LOAD BOT'}</button>
            </div>)}
        </div>
        <footer><span className='ai-scanner__live-dot' /> {adapterInitialized ? 'Listening to volatility tick streams' : 'Connecting to live tick service'} <span>Threshold 55%</span></footer>
    </aside>;
};

export default AIScanner;
