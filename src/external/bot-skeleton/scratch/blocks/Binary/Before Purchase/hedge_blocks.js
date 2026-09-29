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

const register = (type, title, description, rows, generate) => {
    window.Blockly.Blocks[type] = {
        init() { this.jsonInit(this.definition()); this.setNextStatement(false); },
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
            if (!this.workspace || window.Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) return;
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
    message0: localize('Purchase 1: %1 Barrier: Offset %2 %3'),
    message1: localize('Purchase 2: %1 Barrier: Offset %2 %3'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Higher', 'CALL']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_1', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_1', value: 0.31, min: 0, precision: 0.01 }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Lower', 'PUT']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_2', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_2', value: 0.31, min: 0, precision: 0.01 }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { barrierOffset: '${block.getFieldValue('BARRIER_TYPE_1')}${Number(block.getFieldValue('BARRIER_1')) || 0.31}' });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { barrierOffset: '${block.getFieldValue('BARRIER_TYPE_2')}${Number(block.getFieldValue('BARRIER_2')) || 0.31}' });\n`);

register('only_up_down_hedge', 'Only Ups/Only Downs hedge purchase', 'Purchases Only Ups and Only Downs contracts independently.', {
    message0: localize('Purchase 1: %1'), message1: localize('Purchase 2: %1'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Only Ups', 'CALL']] }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Only Downs', 'PUT']] }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}');\nBot.purchase('${block.getFieldValue('PURCHASE_2')}');\n`);

register('over_under_hedge', 'Over/Under hedge purchase', 'Purchases Over and Under contracts with independent stakes and predictions.', {
    message0: localize('Purchase 1: %1 stake 1 %2 Prediction: %3'), message1: localize('Purchase 2: %1 stake 2 %2 Prediction: %3'),
    args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['Over', 'CALL']] }, { type: 'field_number', name: 'STAKE_1', value: 0.35, min: 0.35, precision: 0.01 }, { type: 'field_number', name: 'PREDICTION_1', value: 1, min: 0, precision: 1 }],
    args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['Under', 'PUT']] }, { type: 'field_number', name: 'STAKE_2', value: 0.35, min: 0.35, precision: 0.01 }, { type: 'field_number', name: 'PREDICTION_2', value: 1, min: 0, precision: 1 }],
}, block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { amount: ${Number(block.getFieldValue('STAKE_1')) || 0.35}, barrier: ${Number(block.getFieldValue('PREDICTION_1')) || 1} });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { amount: ${Number(block.getFieldValue('STAKE_2')) || 0.35}, barrier: ${Number(block.getFieldValue('PREDICTION_2')) || 1} });\n`);

export { getOptions };
