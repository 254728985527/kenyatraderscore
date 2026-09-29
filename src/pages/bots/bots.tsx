import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import './bots.scss';

type BotDefinition = {
    id: string;
    name: string;
    description: string;
    file: string;
};

const BOTS: BotDefinition[] = [
    { id: 'ai-premium', name: 'AI Premium BT', description: 'Premium automated trading strategy', file: '/bots/ai-premium-bt.xml' },
    { id: 'cash-printer', name: 'Cash Printer Bot', description: 'Original cash printer strategy', file: '/bots/cash-printer-original.xml' },
    { id: 'digits-over-4', name: 'Digits Over 4', description: 'Martingale PRO digit strategy', file: '/bots/digits-over-4-martingale.xml' },
    { id: 'over-2', name: 'Over 2', description: 'Over 2 digit strategy', file: '/bots/over-2.xml' },
    { id: 'samuel-over-2', name: 'SAMUEL Over 2 PRO', description: 'PRO over 2 strategy', file: '/bots/samuel-over-2-pro.xml' },
    { id: 'over-2-pro', name: 'Over 2 Strategy PRO+', description: 'Advanced over 2 strategy', file: '/bots/over-2-strategy-pro.xml' },
    { id: 'over-2-entry', name: 'Over 2 Strategy + ENTRY', description: 'Over 2 strategy with entry rules', file: '/bots/over-2-strategy-entry.xml' },
    { id: 'hedging', name: 'Hedging Bot', description: 'Higher/lower hedge strategy with all configured blocks', file: '/bots/hedging.xml' },
];

const Bots = observer(() => {
    const { dashboard } = useStore();
    const { isDesktop } = useDevice();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    const loadBot = async (bot: BotDefinition) => {
        const workspace = window.Blockly?.derivWorkspace;
        if (!workspace) {
            setStatus(localize('Bot Builder is still loading. Please try again.'));
            return;
        }

        setLoadingId(bot.id);
        setStatus('');
        try {
            const response = await fetch(bot.file);
            if (!response.ok) throw new Error(`Unable to load ${bot.file}`);
            const xmlText = await response.text();
            const xml = window.Blockly.utils.xml.textToDom(xmlText);
            workspace.asyncClear();
            window.Blockly.Xml.domToWorkspace(xml, workspace);
            dashboard.setActiveTab(1);
            setStatus(`${bot.name} ${localize('loaded in Bot Builder')}`);
        } catch (error) {
            console.error('[v0] Failed to load bot XML:', error);
            setStatus(localize('This bot could not be loaded. Please try another file.'));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <section className='bots-library' aria-labelledby='bots-library-title'>
            <div className='bots-library__header'>
                <div>
                    <p className='bots-library__eyebrow'>DERIV BOT</p>
                    <h1 id='bots-library-title'>{localize('Bots')}</h1>
                    <p>{localize('Choose a ready-made bot to load every block into Bot Builder.')}</p>
                </div>
                <span className='bots-library__count'>{BOTS.length} {localize('bots')}</span>
            </div>
            {status && <p className='bots-library__status' role='status'>{status}</p>}
            <div className='bots-library__grid'>
                {BOTS.map(bot => (
                    <article className='bots-library__card' key={bot.id}>
                        <div className='bots-library__card-icon' aria-hidden='true'>{bot.name.slice(0, 1)}</div>
                        <div className='bots-library__card-content'>
                            <h2>{bot.name}</h2>
                            <p>{bot.description}</p>
                            <button type='button' onClick={() => loadBot(bot)} disabled={loadingId !== null}>
                                {loadingId === bot.id ? localize('Loading...') : localize('Open in Bot Builder')}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
            {!isDesktop && <p className='bots-library__hint'>{localize('Bots open in the mobile Bot Builder workspace.')}</p>}
        </section>
    );
});

export default Bots;
