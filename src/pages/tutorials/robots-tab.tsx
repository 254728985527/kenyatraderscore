import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { load } from '@/external/bot-skeleton/scratch/utils';
import pctOperatorManual from '@/xml/robots/pct-operator-manual.xml';
import targetEntry from '@/xml/robots/target-entry.xml';
import over2Entry from '@/xml/robots/over-2-entry.xml';
import over2StrategyPro from '@/xml/robots/over-2-strategy-pro.xml';
import upsDownsHedging from '@/xml/robots/ups-downs-hedging.xml';
import upsDownsAuto from '@/xml/robots/ups-downs-auto.xml';
import cashPrinter from '@/xml/robots/cash-printer.xml';
import digitsOver4 from '@/xml/robots/digits-over-4.xml';
import manualComDigit from '@/xml/robots/manual-com-digit.xml';
import './robots-tab.scss';

type Robot = { name: string; description: string; xml: string };

const robots: Robot[] = [
    { name: 'PCT Operator Manual', description: 'Manual percentage operator strategy', xml: pctOperatorManual },
    { name: 'Target + Entry', description: 'Target entry workflow', xml: targetEntry },
    { name: 'Over 2 Strategy Entry', description: 'Over 2 entry strategy', xml: over2Entry },
    { name: 'Over 2 Strategy PRO', description: 'Advanced over 2 strategy', xml: over2StrategyPro },
    { name: 'Ups / Downs Hedging', description: 'Ups and downs hedging bot', xml: upsDownsHedging },
    { name: 'Ups / Downs Auto', description: 'Automated ups and downs bot', xml: upsDownsAuto },
    { name: 'Cash Printer', description: 'Cash printer bot', xml: cashPrinter },
    { name: 'Digits Over 4 PRO', description: 'Digits over 4 martingale', xml: digitsOver4 },
    { name: 'Manual COM Digit', description: 'Manual contract digit entry', xml: manualComDigit },
];

const RobotsTab = observer(() => {
    const { dashboard } = useStore();

    const loadRobot = async (robot: Robot) => {
        const workspace = window.Blockly?.derivWorkspace;
        if (!workspace || !window.Blockly) return;
        workspace.current_strategy_id = window.Blockly.utils.idGenerator.genUid();
        await load({
            block_string: robot.xml,
            file_name: robot.name,
            workspace,
            drop_event: null,
            strategy_id: null,
            from: null,
            showIncompatibleStrategyDialog: null,
        });
        workspace.strategy_to_load = robot.xml;
        dashboard.setActiveTab(1);
    };

    return (
        <section className='robots-tab' aria-labelledby='robots-tab-title'>
            <div className='robots-tab__intro'>
                <div>
                    <p className='robots-tab__eyebrow'>Bot library</p>
                    <h2 id='robots-tab-title'>Robots</h2>
                    <p>Choose a ready-made bot to load it directly into Bot Builder.</p>
                </div>
                <span className='robots-tab__count'>{robots.length} bots</span>
            </div>
            <div className='robots-tab__grid'>
                {robots.map((robot, index) => (
                    <button
                        className={classNames('robots-tab__card', `robots-tab__card--tone-${(index % 3) + 1}`)}
                        key={robot.name}
                        onClick={() => loadRobot(robot)}
                        type='button'
                    >
                        <span className='robots-tab__card-index'>{String(index + 1).padStart(2, '0')}</span>
                        <span className='robots-tab__card-content'>
                            <strong>{robot.name}</strong>
                            <small>{robot.description}</small>
                        </span>
                        <span className='robots-tab__card-action' aria-hidden='true'>Load</span>
                    </button>
                ))}
            </div>
        </section>
    );
});

export default RobotsTab;
