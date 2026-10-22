import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { DBOT_TABS } from '@/constants/bot-contents';
import './robots.scss';

type Robot = { name: string; description: string; file: string; accent: string };

const robots: Robot[] = [
    { name: 'PCT Operator Manual', description: 'Manual digit percentage operator strategy.', file: 'pct-operator-manual.xml', accent: '#0b6178' },
    { name: 'Target + Entry', description: 'Target digit entry strategy.', file: 'target-entry.xml', accent: '#2563a6' },
    { name: 'Over 2 Strategy Entry', description: 'Over 2 digit entry bot.', file: 'over-2-entry.xml', accent: '#147d70' },
    { name: 'Over 2 Strategy PRO', description: 'Advanced Over 2 strategy.', file: 'over-2-pro.xml', accent: '#7a4fa3' },
    { name: 'Only Ups & Downs', description: 'Automatic direction strategy.', file: 'only-ups-downs.xml', accent: '#c06a2b' },
    { name: 'Cash Printer', description: 'Original cash printer bot.', file: 'cash-printer.xml', accent: '#a5425b' },
    { name: 'Manual Com Digit', description: 'Manual comparison digit strategy.', file: 'manual-com-digit.xml', accent: '#3b6e8f' },
    { name: 'Digits Over 4 Martingale', description: 'Digits Over 4 with recovery logic.', file: 'digits-over-4-martingale.xml', accent: '#5c7d3c' },
];

const Robots = observer(({ handleTabChange }: { handleTabChange: (tab: number) => void }) => {
    const { load_modal } = useStore();
    const [loading, setLoading] = useState<string | null>(null);

    const loadRobot = async (robot: Robot) => {
        setLoading(robot.file);
        try {
            const response = await fetch(`/robots/${robot.file}`);
            const xml = await response.text();
            const convertedDom = window.Blockly.utils.xml.textToDom(xml);
            window.Blockly.xmlValues = {
                strategy_id: window.Blockly.utils.idGenerator.genUid(),
                convertedDom,
                block_string: xml,
                file_name: robot.name,
            };
            await load_modal.loadStrategyOnBotBuilder();
            handleTabChange(DBOT_TABS.BOT_BUILDER);
        } finally {
            setLoading(null);
        }
    };

    return (
        <main className='robots-page' aria-labelledby='robots-title'>
            <div className='robots-page__heading'>
                <div>
                    <p className='robots-page__eyebrow'>BOT LIBRARY</p>
                    <h1 id='robots-title'>Robots</h1>
                    <p>Select any robot to load it directly into Bot Builder.</p>
                </div>
                <span className='robots-page__count'>{robots.length} bots</span>
            </div>
            <div className='robots-grid'>
                {robots.map(robot => (
                    <button
                        className='robot-card'
                        key={robot.file}
                        type='button'
                        onClick={() => loadRobot(robot)}
                        disabled={loading !== null}
                    >
                        <span className='robot-card__accent' style={{ backgroundColor: robot.accent }} />
                        <span className='robot-card__body'>
                            <span className='robot-card__title'>{robot.name}</span>
                            <span className='robot-card__description'>{robot.description}</span>
                            <span className='robot-card__action'>{loading === robot.file ? 'Loading…' : 'Open in Bot Builder →'}</span>
                        </span>
                    </button>
                ))}
            </div>
        </main>
    );
});

export default Robots;
