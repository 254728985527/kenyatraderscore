import React, { useMemo, useState } from 'react';
import './hedging.scss';

type HedgingMode = 'over-under' | 'ups-downs' | 'high-low';
type TickMode = 'high' | 'low';

type VolatilityMarket = {
    name: string;
    price: string;
    change: string;
    tone: 'up' | 'down';
};

const volatilityMarkets: VolatilityMarket[] = [
    { name: 'Volatility 100 (1s) Index', price: '938.04', change: '- 0.17 (0.02%)', tone: 'down' },
    { name: 'Volatility 75 (1s) Index', price: '895874.65', change: '+ 12.40 (0.14%)', tone: 'up' },
    { name: 'Volatility 50 (1s) Index', price: '1042.18', change: '+ 2.08 (0.20%)', tone: 'up' },
    { name: 'Volatility 25 (1s) Index', price: '896921.38', change: '- 4.12 (0.05%)', tone: 'down' },
];

const VolatilitySelector = () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(volatilityMarkets[0]);

    return (
        <div className={`volatility-selector ${open ? 'volatility-selector--open' : ''}`}>
            <button className='volatility-selector__trigger' type='button' onClick={() => setOpen(!open)} aria-expanded={open}>
                <span className='volatility-selector__icon'><b>{selected.name.match(/\\d+/)?.[0]}</b><i>1s</i><span>▥<br />▥</span></span>
                <span className='volatility-selector__copy'><strong>{selected.name}</strong><small>{selected.price} <em className={`volatility-selector__change volatility-selector__change--${selected.tone}`}>{selected.change} {selected.tone === 'down' ? '▼' : '▲'}</em></small></span>
                <span className='volatility-selector__chevron'>{open ? '⌃' : '⌄'}</span>
            </button>
            {open && <div className='volatility-selector__menu' role='listbox' aria-label='Volatility markets'>{volatilityMarkets.map(market => <button key={market.name} type='button' role='option' aria-selected={selected.name === market.name} onClick={() => { setSelected(market); setOpen(false); }}><strong>{market.name}</strong><small>{market.price} <em className={`volatility-selector__change--${market.tone}`}>{market.change}</em></small></button>)}</div>}
        </div>
    );
};

type TickPanelProps = {
    mode: TickMode;
    selected: boolean;
    onSelect: () => void;
};

const tickData = {
    high: {
        title: 'High Tick',
        target: 'Peak Target: #5',
        status: 'READY',
        points: '52,120 145,88 220,116 315,74 405,128',
        targetY: 74,
        targetLabel: 'Tick 5: Highest Tick',
        color: '#ec3f58',
    },
    low: {
        title: 'Low Tick',
        target: 'Valley Target: #5',
        status: 'LOSS',
        points: '52,82 145,112 220,88 315,126 405,58',
        targetY: 126,
        targetLabel: 'Tick 5: Lowest Tick',
        color: '#ec3f58',
    },
};

const TickPanel = ({ mode, selected, onSelect }: TickPanelProps) => {
    const data = tickData[mode];
    const [stakeEnabled, setStakeEnabled] = useState(false);
    const [stake, setStake] = useState('10.00');
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState('Select this strategy to configure it independently.');

    const potentialPayout = useMemo(() => (Number(stake || 0) * 1.95).toFixed(2), [stake]);

    const handleRun = () => {
        if (!stakeEnabled || Number(stake) <= 0) {
            setMessage('Enable manual stake and enter an amount before running.');
            return;
        }
        setRunning(true);
        setMessage(`${data.title} hedge is running with $${Number(stake).toFixed(2)} stake.`);
    };

    return (
        <article className={`tick-panel tick-panel--${mode} ${selected ? 'tick-panel--selected' : ''}`}>
            <button className='tick-panel__heading' type='button' onClick={onSelect} aria-pressed={selected}>
                <span>
                    <strong>{data.title}</strong> <small>({data.target})</small>
                </span>
                <span className={`tick-panel__status ${running ? 'tick-panel__status--running' : ''}`}>{running ? 'RUNNING' : data.status}</span>
            </button>
            <div className='tick-chart' role='img' aria-label={`${data.title} independent tick chart`}>
                <svg viewBox='0 0 460 170' preserveAspectRatio='none' aria-hidden='true'>
                    <defs>
                        <pattern id={`grid-${mode}`} width='38' height='28' patternUnits='userSpaceOnUse'>
                            <path d='M 38 0 L 0 0 0 28' fill='none' stroke='#e7ebf1' strokeWidth='1' />
                        </pattern>
                    </defs>
                    <rect width='460' height='170' fill={`url(#grid-${mode})`} />
                    <line x1='0' x2='460' y1={data.targetY} y2={data.targetY} stroke='#8492a6' strokeDasharray='5 5' />
                    <polyline points={data.points} fill='none' stroke='#8d9caf' strokeWidth='3' strokeLinejoin='round' />
                    <circle cx='52' cy={mode === 'high' ? 120 : 82} r='5' fill='#536b85' />
                    <circle cx='405' cy={mode === 'high' ? 128 : 58} r='5' fill='#536b85' />
                    <circle cx='315' cy={data.targetY} r='10' fill='white' stroke={data.color} strokeWidth='4' />
                    <text x='24' y='146' fill='#334155' fontSize='12' fontWeight='600'>Start</text>
                    <text x='365' y={mode === 'high' ? 152 : 48} fill='#334155' fontSize='12' fontWeight='600'>Exit Tick</text>
                    <text x='230' y={mode === 'high' ? 42 : 150} textAnchor='middle' fill='#253b57' fontSize='13' fontWeight='700'>{data.targetLabel}</text>
                </svg>
            </div>
            <div className='tick-panel__controls'>
                <div className='tick-panel__control-row'>
                    <div>
                        <span className='tick-panel__label'>Manual stake</span>
                        <span className='tick-panel__hint'>Set a separate stake for {data.title}.</span>
                    </div>
                    <button className={`toggle ${stakeEnabled ? 'toggle--on' : ''}`} type='button' onClick={() => setStakeEnabled(!stakeEnabled)} aria-pressed={stakeEnabled} aria-label={`Toggle manual stake for ${data.title}`}>
                        <span />
                    </button>
                </div>
                <label className={`stake-input ${!stakeEnabled ? 'stake-input--disabled' : ''}`}>
                    <span>$</span>
                    <input type='number' min='0.01' step='0.01' value={stake} disabled={!stakeEnabled} onChange={event => setStake(event.target.value)} aria-label={`${data.title} stake amount`} />
                </label>
                <div className='tick-panel__summary'><span>Potential payout</span><strong>${potentialPayout}</strong></div>
                <button className='run-button' type='button' onClick={handleRun}>{running ? 'Running' : `Run ${data.title}`}</button>
                <p className='tick-panel__message' role='status'>{message}</p>
            </div>
        </article>
    );
};

const UpsDowns = () => (
    <div className='ups-downs' role='tabpanel' aria-label='Only ups and downs trading'>
        <VolatilitySelector />
        <div className='ups-downs__cards'>
            {[
                { type: 'ups', title: 'ONLY UPS', subtitle: 'Continuous Rise (Tick N+1 > Tick N)', color: 'green', points: '54,108 180,76 310,42 430,20' },
                { type: 'downs', title: 'ONLY DOWNS', subtitle: 'Continuous Fall (Tick N+1 < Tick N)', color: 'blue', points: '54,32 180,62 310,88 430,116' },
            ].map(card => (
                <article className={`direction-card direction-card--${card.color}`} key={card.type}>
                    <header className='direction-card__header'>
                        <div className='direction-card__identity'><span className='direction-card__icon'>{card.type === 'ups' ? '↗' : '↘'}</span><div><h2>{card.title}</h2><p>{card.subtitle}</p></div></div>
                        <div className='direction-card__meta'><span>RUN {card.type === 'ups' ? 'HIGH' : 'LOW'}</span><b>Ready</b><strong>Active</strong></div>
                    </header>
                    <div className='direction-card__chart' role='img' aria-label={`${card.title} trend chart`}>
                        <span className='direction-card__badge'>✓ {card.type === 'ups' ? 'Continuous Rise' : 'Continuous Fall'} (0/2 Ticks)</span>
                        <svg viewBox='0 0 480 140' preserveAspectRatio='none' aria-hidden='true'><defs><pattern id={`ups-grid-${card.type}`} width='28' height='22' patternUnits='userSpaceOnUse'><path d='M 28 0 L 0 0 0 22' fill='none' stroke='#dce7f4' /></pattern></defs><rect width='480' height='140' fill={`url(#ups-grid-${card.type})`} /><polyline points={card.points} fill='none' stroke='currentColor' strokeWidth='4' /><circle cx='54' cy={card.type === 'ups' ? 108 : 32} r='6' fill='currentColor' /><circle cx='310' cy={card.type === 'ups' ? 42 : 88} r='5' fill='white' stroke='currentColor' strokeWidth='3' /><circle cx='430' cy={card.type === 'ups' ? 20 : 116} r='6' fill='#536b85' /></svg>
                        <span className='direction-card__start'>Start: 896921.38</span><span className='direction-card__end'>End</span>
                    </div>
                    <div className='direction-card__stats'><span>ENTRY SPOT<strong>--</strong></span><span>CONSECUTIVE<strong>0 / 2 Ticks</strong></span><span>REAL PAYOUT<strong>$3.82 <small>(+282%)</small></strong></span><span>Current Stake:<strong>$0.35</strong></span></div>
                    <button className='direction-card__buy' type='button'>▶&nbsp; BUY ONLY {card.type.toUpperCase()} <small>|&nbsp; Payout: $3.82 USD (+282%)</small></button>
                </article>
            ))}
        </div>
        <div className='ups-downs__entry'><span>ENTRY PRICE:</span><strong>895874.65</strong><span>Market: Volatility 25 (1s) Index&nbsp; • &nbsp;Ticks sampled: 60</span></div>
        <div className='ups-downs__probabilities'><div><b>↗ UP</b><span>Probability <strong>36%</strong></span></div><div><b>↘ DOWN</b><span>Probability <strong>64%</strong></span></div></div>
    </div>
);

const OverUnder = () => {
    const [target, setTarget] = useState(4);
    const [threshold, setThreshold] = useState(15);
    const [scope, setScope] = useState('all');
    const [overStake, setOverStake] = useState('0.35');
    const [underStake, setUnderStake] = useState('0.35');
    const [running, setRunning] = useState(false);

    return (
        <div className='shield-hedging' role='tabpanel' aria-label='Shield over and under hedging'>
            <div className='shield-market-header'>
                <div className='shield-target-strip'>
                    <span className='shield-target-strip__icon'>◉</span>
                    <strong>TARGET DIGIT SELECTION (0 - 9):</strong>
                </div>
                <button className='shield-market-card' type='button' aria-label='Select market'>
                    <span className='shield-market-card__icon'><b>100</b><i>1s</i><span>▥<br />▥</span></span>
                    <span className='shield-market-card__copy'><strong>Volatility 100 (1s) Index</strong><small>938.04 - 0.17 (0.02%) <em>▼</em></small></span>
                    <span className='shield-market-card__chevron'>⌄</span>
                </button>
            </div>
            <div className='shield-section shield-section--targets'>
                <div className='shield-section__heading'><span>◉</span><strong>SELECT TARGET DIGIT:</strong><b>Active: Target D{target} (8.0%) <em>— Filters ≥{threshold}% Markets (2 Qualified)</em></b></div>
                <div className='digit-grid'>{Array.from({ length: 10 }, (_, digit) => <button key={digit} type='button' className={`digit-card ${target === digit ? 'digit-card--active' : ''}`} onClick={() => setTarget(digit)}><strong>{digit}</strong><span>{digit === 4 ? '8.0%' : digit === 6 ? '15.0%' : digit === 9 ? '5.0%' : digit % 3 === 0 ? '9.0%' : '11.0%'}</span>{target === digit && <small>TARGET</small>}</button>)}</div>
            </div>
            <div className='shield-section'>
                <div className='shield-section__heading'><span>◉</span><strong>CONTINUOUS TRADING POOL: <em>All Active Synthetics (2 Rotating)</em></strong><b>1 Trade / Market Continuous</b></div>
                <div className='threshold-row'><strong>SELECT QUALIFYING THRESHOLD ON TARGET D{target}:</strong>{[10, 12, 14, 15, 16].map(value => <button key={value} type='button' className={threshold === value ? 'threshold-card--active' : ''} onClick={() => setThreshold(value)}><b>{value}%</b><span>{value === 15 ? '2 Mkts' : value === 16 ? '1 Mkt' : `${22 - value} Markets`}</span></button>)}</div>
            </div>
            <div className='shield-section'>
                <div className='shield-section__heading'><span>◉</span><strong>POOL TRADING SCOPE:</strong><b>Sequential 1-Trade Continuous Rotation</b></div>
                <div className='scope-row'>{[['all', 'All (≥15%)', '2 Active'], ['one', '1 Market', 'Top 1'], ['two', '2 Markets', 'Top 2'], ['three', '3 Markets', 'Top 3'], ['four', '4 Markets', 'Top 4']].map(([value, label, note]) => <button key={value} type='button' className={scope === value ? 'scope-card--active' : ''} onClick={() => setScope(value)}><strong>{label}</strong><span>{note}</span></button>)}</div>
            </div>
            <div className='trade-controls'>
                <div className='trade-leg trade-leg--over'><label>↕ <span>Trade Type</span><select defaultValue='Over'><option>Over</option><option>Under</option></select></label><label>◉ <span>Stake</span><input type='number' min='0.01' step='0.01' value={overStake} onChange={event => setOverStake(event.target.value)} /></label></div>
                <label className='martingale'>▥ <span>Martingale</span><input type='number' min='1' step='0.01' defaultValue='1.23' /></label>
                <div className='trade-leg trade-leg--under'><label>↻ <span>Trade Type</span><select defaultValue='Under'><option>Under</option><option>Over</option></select></label><label>◉ <span>Stake</span><input type='number' min='0.01' step='0.01' value={underStake} onChange={event => setUnderStake(event.target.value)} /></label></div>
            </div>
            <button className={`shield-run ${running ? 'shield-run--running' : ''}`} type='button' onClick={() => setRunning(true)}>{running ? 'HEDGING ACTIVE' : 'RUN SHIELD OVER / UNDER HEDGING'}</button>
        </div>
    );
};

const Hedging = () => {
    const [activeMode, setActiveMode] = useState<HedgingMode>('high-low');
    const selectMode = (mode: HedgingMode) => setActiveMode(mode);
    return (
        <section className='hedging' aria-labelledby='hedging-title'>
            <nav className='hedging__tabs' aria-label='Hedging strategies' role='tablist'>
                <button className={`hedging__tab ${activeMode === 'over-under' ? 'hedging__tab--active' : ''}`} type='button' role='tab' aria-selected={activeMode === 'over-under'} onClick={() => selectMode('over-under')}>Shield&nbsp; Over / Under Hedging</button>
                <button className={`hedging__tab ${activeMode === 'ups-downs' ? 'hedging__tab--active' : ''}`} type='button' role='tab' aria-selected={activeMode === 'ups-downs'} onClick={() => selectMode('ups-downs')}>↗&nbsp; Only Ups / Downs</button>
                <button className={`hedging__tab ${activeMode === 'high-low' ? 'hedging__tab--active' : ''}`} type='button' role='tab' aria-selected={activeMode === 'high-low'} onClick={() => selectMode('high-low')}>ϟ&nbsp; High / Low Tick</button>
            </nav>
            {activeMode === 'ups-downs' ? <UpsDowns /> : activeMode === 'over-under' ? <OverUnder /> : <><VolatilitySelector /><div className='hedging__title-row'><div><p className='hedging__kicker'>Selected strategy</p><h1 id='hedging-title'>High / Low Tick</h1></div><p className='hedging__intro'>Trade both independent hedge legs from one view.</p></div><div className='tick-grid' role='tabpanel'><TickPanel mode='high' selected={activeMode === 'high-low'} onSelect={() => selectMode('high-low')} /><TickPanel mode='low' selected={activeMode === 'high-low'} onSelect={() => selectMode('high-low')} /></div></>}
        </section>
    );
};

export default Hedging;
