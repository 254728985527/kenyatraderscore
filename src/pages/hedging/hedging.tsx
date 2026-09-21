import React, { useMemo, useState } from 'react';
import './hedging.scss';

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

const Hedging = () => {
    const [selected, setSelected] = useState<TickMode | null>(null);

    return (
        <section className='hedging' aria-labelledby='hedging-title'>
            <header className='hedging__header'>
                <div><p className='hedging__kicker'>Risk management</p><h1 id='hedging-title'>Hedging strategies</h1><p className='hedging__intro'>Select a setup and manage each hedge independently.</p></div>
                <span className='hedging__badge'>High / Low Tick</span>
            </header>
            <div className='tick-grid'>
                <TickPanel mode='high' selected={selected === 'high'} onSelect={() => setSelected(selected === 'high' ? null : 'high')} />
                <TickPanel mode='low' selected={selected === 'low'} onSelect={() => setSelected(selected === 'low' ? null : 'low')} />
            </div>
            <p className='hedging__note'>Each strategy has its own stake and run control. Selecting both lets High Tick and Low Tick hedge independently.</p>
        </section>
    );
};

export default Hedging;
