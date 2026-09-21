import React from 'react';
import './hedging.scss';

type HedgingStrategy = {
    title: string;
    eyebrow: string;
    description: string;
    steps: string[];
    accent: string;
};

const strategies: HedgingStrategy[] = [
    {
        title: 'Over/Under Hedging',
        eyebrow: 'Balance both outcomes',
        description: 'Use complementary Over and Under contracts to manage exposure when the market is moving quickly.',
        steps: ['Choose the same market and expiry', 'Open the primary Over or Under position', 'Hedge with the opposite contract when risk increases'],
        accent: 'hedging-card--blue',
    },
    {
        title: 'Only Ups/Downs',
        eyebrow: 'Directional protection',
        description: 'Keep your strategy focused on Up and Down contracts while controlling the amount committed to each direction.',
        steps: ['Pick a clear direction before entry', 'Set a fixed stake for the first trade', 'Use a smaller opposite-direction hedge if needed'],
        accent: 'hedging-card--green',
    },
    {
        title: 'High/Low Tick',
        eyebrow: 'Short-term tick control',
        description: 'Combine High and Low Tick positions to reduce the impact of sudden price changes near the contract barrier.',
        steps: ['Review recent tick movement', 'Enter the stronger High or Low setup', 'Offset the position before volatility peaks'],
        accent: 'hedging-card--purple',
    },
];

const Hedging = () => (
    <section className='hedging' aria-labelledby='hedging-title'>
        <header className='hedging__header'>
            <div>
                <p className='hedging__kicker'>Risk management</p>
                <h1 id='hedging-title'>Hedging strategies</h1>
                <p className='hedging__intro'>Explore practical ways to balance exposure across complementary contracts.</p>
            </div>
            <span className='hedging__badge'>3 strategies</span>
        </header>
        <div className='hedging__grid'>
            {strategies.map(strategy => (
                <article className={`hedging-card ${strategy.accent}`} key={strategy.title}>
                    <div className='hedging-card__topline'>
                        <span className='hedging-card__dot' aria-hidden='true' />
                        <span>{strategy.eyebrow}</span>
                    </div>
                    <h2>{strategy.title}</h2>
                    <p className='hedging-card__description'>{strategy.description}</p>
                    <ol>
                        {strategy.steps.map(step => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </article>
            ))}
        </div>
        <p className='hedging__note'>Hedging does not remove risk. Review your stake, expiry, and potential payout before placing a trade.</p>
    </section>
);

export default Hedging;
