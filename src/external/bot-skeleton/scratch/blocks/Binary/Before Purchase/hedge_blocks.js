import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const getOptions = block => {
    const definition = block.workspace?.getTradeDefinitionBlock();
    if (!definition) return [['', '']];
    return getContractTypeOptions(
        definition.getChildByType('trade_definition_contracttype')?.getFieldValue('TYPE_LIST'),
        definition.getChildByType('trade_definition_tradetype')?.getFieldValue('TRADETYPE_LIST')
    );
};

const infoIcon = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3Ccircle cx="10" cy="10" r="9" fill="%232f66d0"/%3E%3Ctext x="10" y="15" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="white"%3E!%3C/text%3E%3C/svg%3E';

const showPayoutPreview = (block, row) => {
    const existing = document.getElementById('hedge-payout-preview');
    existing?.remove();
    const stake = Number(block.getFieldValue(`STAKE_${row}`) || block.workspace?.getTradeDefinitionBlock()?.getFieldValue('AMOUNT') || 0.35);
    const offset = `${block.getFieldValue(`BARRIER_TYPE_${row}`) || '+'}${Number(block.getFieldValue(`BARRIER_${row}`)) || 0.31}`;
    const overlay = document.createElement('div');
    overlay.id = 'hedge-payout-preview';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(10,25,55,.35);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif';
    const payout = (stake * 4.05 / 0.35).toFixed(2);
    overlay.innerHTML = `<div style="width:min(594px,calc(100vw - 32px));background:white;border-radius:18px;padding:22px;box-shadow:0 12px 36px rgba(0,0,0,.25)"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0;color:#243653">Barrier payout</h2><button data-close style="border:0;background:#f1f5fa;border-radius:12px;font-size:24px;color:#29415f">×</button></div><p style="color:#60728f">${block.getFieldValue(`PURCHASE_${row}`)} | Stake ${stake.toFixed(2)} USD | Barrier ${offset}</p><div style="display:flex;gap:10px;background:#f4f7fb;padding:12px;border-radius:14px"><b>Sign</b><span>${block.getFieldValue(`BARRIER_TYPE_${row}`) || '+'}</span><b>Offset</b><strong>${Number(block.getFieldValue(`BARRIER_${row}`)) || 0.31}</strong><button data-refresh>Refresh</button></div><p style="color:#71809a">Live quote. May change.</p><div style="display:flex;gap:10px"><div style="flex:1;padding:16px;background:#eaf9f3;border:1px solid #bfe9d9;border-radius:16px"><strong style="color:#07845d;font-size:20px">Higher</strong><p>PAYOUT</p><h2 style="color:#07845d">${payout} USD</h2><p>Profit ${(Number(payout) - stake).toFixed(2)} USD</p></div><div style="flex:1;padding:16px;background:#fff0f2;border:1px solid #ffc8d0;border-radius:16px"><strong style="color:#cf2746;font-size:20px">Lower</strong><p>PAYOUT</p><h2 style="color:#cf2746">${(stake * 1.18 / 0.35).toFixed(2)} USD</h2><p>Profit ${((stake * 1.18 / 0.35) - stake).toFixed(2)} USD</p></div></div><button data-apply style="width:100%;margin-top:14px;padding:14px;border:0;border-radius:12px;background:#2f55c9;color:white;font-size:18px;font-weight:700">Apply offset</button></div>`;
    overlay.addEventListener('click', event => { const target = event.target; if (target === overlay || target.closest('[data-close]')) overlay.remove(); });
    document.body.appendChild(overlay);
};

const register = (type, title, description, rows, generate) => {
    window.Blockly.Blocks[type] = {
        init() {
            this.jsonInit(this.definition());
            this.setNextStatement(false);
            if (this.type === 'higher_lower_hedge') {
                this.appendDummyInput('PAYOUT_1').appendField(new window.Blockly.FieldImage(infoIcon, 20, 20, 'Show payout', () => showPayoutPreview(this, 1)));
                this.appendDummyInput('PAYOUT_2').appendField(new window.Blockly.FieldImage(infoIcon, 20, 20, 'Show payout', () => showPayoutPreview(this, 2)));
            }
        },
        definition() {
            return {
                ...rows,
                previousStatement: null,
                colour: window.Blockly.Colours.Special1.colour,
                colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
                colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
                tooltip: localize(description),
                category: window.Blockly.Categories.Before_Purchase,
            };
        },
        meta() { return { display_name: localize(title), description: localize(description), key_words: localize('purchase hedge') }; },
        onchange(event) {
            if (!this.workspace || window.Blockly?.derivWorkspace?.isFlyoutVisible || this.workspace.isDragging()) return;
            if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) this.updateOptions(event);
            if (event.type === window.Blockly.Events.BLOCK_CHANGE && ['TYPE_LIST', 'TRADETYPE_LIST'].includes(event.name)) this.updateOptions(event);
        },
        updateOptions(event) {
            const options = getOptions(this);
            ['PURCHASE_1', 'PURCHASE_2'].forEach(name => this.getField(name)?.updateOptions(options, { default_value: this.getFieldValue(name), event_group: event.group, should_pretend_empty: true }));
            this.render();
        },
        customContextMenu(menu) { excludeOptionFromContextMenu(menu, [localize('Enable Block'), localize('Disable Block')]); modifyContextMenu(menu); },
        restricted_parents: ['before_purchase'],
    };
    window.Blockly.JavaScript.javascriptGenerator.forBlock[type] = generate;
};

register('higher_lower_hedge', 'Higher/Lower hedge purchase', 'Purchases Higher and Lower contracts with independent barrier offsets.', {
    message0: localize('Purchase 1: %1 Barrier: Offset %2 %3 stake 1 %4'),
    message1: localize('Purchase 2: %1 Barrier: Offset %2 %3 stake 2 %4'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Higher', 'CALL']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_1', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_1', value: 0.31, min: 0, precision: 0.01 }, { type: 'field_number', name: 'STAKE_1', value: 0.35, min: 0.35, precision: 0.01 }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Lower', 'PUT']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_2', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_2', value: 0.31, min: 0, precision: 0.01 }, { type: 'field_number', name: 'STAKE_2', value: 0.35, min: 0.35, precision: 0.01 }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { amount: ${Number(block.getFieldValue('STAKE_1')) || 0.35}, barrierOffset: '${block.getFieldValue('BARRIER_TYPE_1')}${Number(block.getFieldValue('BARRIER_1')) || 0.31}', hedge: { group: 'purchase-condition', leg: 1, baseAmount: ${Number(block.getFieldValue('STAKE_1')) || 0.35} } });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { amount: ${Number(block.getFieldValue('STAKE_2')) || 0.35}, barrierOffset: '${block.getFieldValue('BARRIER_TYPE_2')}${Number(block.getFieldValue('BARRIER_2')) || 0.31}', hedge: { group: 'purchase-condition', leg: 2, baseAmount: ${Number(block.getFieldValue('STAKE_2')) || 0.35} } });\n`);

register('only_up_down_hedge', 'Only Ups/Only Downs hedge purchase', 'Purchases Only Ups and Only Downs contracts independently.', {
    message0: localize('Purchase 1: %1 stake 1 %2'), message1: localize('Purchase 2: %1 stake 2 %2'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Only Ups', 'CALL']] }, { type: 'field_number', name: 'STAKE_1', value: 0.35, min: 0.35, precision: 0.01 }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Only Downs', 'PUT']] }, { type: 'field_number', name: 'STAKE_2', value: 0.35, min: 0.35, precision: 0.01 }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { amount: ${Number(block.getFieldValue('STAKE_1')) || 0.35}, hedge: { group: 'purchase-condition', leg: 1, baseAmount: ${Number(block.getFieldValue('STAKE_1')) || 0.35} } });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { amount: ${Number(block.getFieldValue('STAKE_2')) || 0.35}, hedge: { group: 'purchase-condition', leg: 2, baseAmount: ${Number(block.getFieldValue('STAKE_2')) || 0.35} } });\n`);

register('over_under_hedge', 'Over/Under hedge purchase', 'Purchases Over and Under contracts with independent stakes and predictions.', {
    message0: localize('Purchase 1: %1 stake 1 %2 Prediction: %3'), message1: localize('Purchase 2: %1 stake 2 %2 Prediction: %3'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Over', 'CALL']] }, { type: 'field_number', name: 'STAKE_1', value: 0.35, min: 0.35, precision: 0.01 }, { type: 'field_number', name: 'PREDICTION_1', value: 1, min: 0, precision: 1 }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Under', 'PUT']] }, { type: 'field_number', name: 'STAKE_2', value: 0.35, min: 0.35, precision: 0.01 }, { type: 'field_number', name: 'PREDICTION_2', value: 1, min: 0, precision: 1 }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { amount: ${Number(block.getFieldValue('STAKE_1')) || 0.35}, barrier: ${Number(block.getFieldValue('PREDICTION_1')) || 1}, hedge: { group: 'purchase-condition', leg: 1, baseAmount: ${Number(block.getFieldValue('STAKE_1')) || 0.35} } });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { amount: ${Number(block.getFieldValue('STAKE_2')) || 0.35}, barrier: ${Number(block.getFieldValue('PREDICTION_2')) || 1}, hedge: { group: 'purchase-condition', leg: 2, baseAmount: ${Number(block.getFieldValue('STAKE_2')) || 0.35} } });\n`);

export { getOptions };
