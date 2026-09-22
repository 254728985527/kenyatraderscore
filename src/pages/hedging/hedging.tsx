import React, { useMemo, useState } from 'react';
import './hedging.scss';

type HedgingMode = 'over-under' | 'ups-downs' | 'high-low';
type TickMode = 'high' | 'low';

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
            {activeMode === 'ups-downs' ? <UpsDowns /> : <><div className='hedging__title-row'><div><p className='hedging__kicker'>Selected strategy</p><h1 id='hedging-title'>{activeMode === 'high-low' ? 'High / Low Tick' : 'Over / Under Hedging'}</h1></div><p className='hedging__intro'>Trade both independent hedge legs from one view.</p></div><div className='tick-grid' role='tabpanel'><TickPanel mode='high' selected={activeMode === 'high-low'} onSelect={() => selectMode('high-low')} /><TickPanel mode='low' selected={activeMode === 'high-low'} onSelect={() => selectMode('high-low')} /></div></>}
        </section>
    );
};

export default Hedging;
