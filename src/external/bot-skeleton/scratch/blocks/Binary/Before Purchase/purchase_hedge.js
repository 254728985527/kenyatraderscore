import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const getOptions = block => {
    const tradeDefinition = block.workspace?.getTradeDefinitionBlock();
    if (!tradeDefinition) return [['', '']];

    const tradeType = tradeDefinition.getChildByType('trade_definition_tradetype')?.getFieldValue('TRADETYPE_LIST');
    const contractType = tradeDefinition.getChildByType('trade_definition_contracttype')?.getFieldValue('TYPE_LIST');
    return getContractTypeOptions(contractType, tradeType);
};

window.Blockly.Blocks.purchase_hedge = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Purchase 1: %1 Barrier: %2 %3 stake 1 %4 Prediction: %5'),
            message1: localize('Purchase 2: %1 Barrier: %2 %3 stake 2 %4 Prediction: %5'),
            args0: [
                { type: 'field_dropdown', name: 'PURCHASE_1', options: [['', '']] },
                { type: 'field_dropdown', name: 'BARRIER_TYPE_1', options: [['+', '+'], ['-', '-']] },
                { type: 'field_number', name: 'BARRIER_1', value: 0.31, min: 0, precision: 0.01 },
                { type: 'field_number', name: 'STAKE_1', value: 0.35, min: 0.35, precision: 0.01 },
                { type: 'field_number', name: 'PREDICTION_1', value: 1, min: 0, precision: 1 },
            ],
            args1: [
                { type: 'field_dropdown', name: 'PURCHASE_2', options: [['', '']] },
                { type: 'field_dropdown', name: 'BARRIER_TYPE_2', options: [['+', '+'], ['-', '-']] },
                { type: 'field_number', name: 'BARRIER_2', value: 0.31, min: 0, precision: 0.01 },
                { type: 'field_number', name: 'STAKE_2', value: 0.35, min: 0.35, precision: 0.01 },
                { type: 'field_number', name: 'PREDICTION_2', value: 1, min: 0, precision: 1 },
            ],
            previousStatement: null,
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            tooltip: localize('Purchase both selected contracts together as a hedge.'),
            category: window.Blockly.Categories.Before_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Hedge purchase'),
            description: localize('Purchases both selected contracts when this block runs, sending the two hedge orders in sequence.'),
            key_words: localize('hedge both contracts simultaneous'),
        };
    },
    onchange(event) {
        if (!this.workspace || window.Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) return;
        if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) this.populateOptions(event);
        if (event.type === window.Blockly.Events.BLOCK_CHANGE && ['TYPE_LIST', 'TRADETYPE_LIST', 'TRADETYPECAT_LIST'].includes(event.name)) {
            this.populateOptions(event);
        }
        if (event.type === window.Blockly.Events.BLOCK_CHANGE && ['PURCHASE_1', 'PURCHASE_2'].includes(event.name)) {
            this.updateBarrierVisibility();
        }
    },
    populateOptions(event) {
        const options = getOptions(this);
        ['PURCHASE_1', 'PURCHASE_2'].forEach(name => {
            const field = this.getField(name);
            field?.updateOptions(options, { default_value: field.getValue(), event_group: event.group, should_pretend_empty: true });
        });
        this.updateBarrierVisibility();
    },
    updateBarrierVisibility() {
        const tradeDefinition = this.workspace?.getTradeDefinitionBlock();
        const tradeType = tradeDefinition?.getChildByType('trade_definition_tradetype')?.getFieldValue('TRADETYPECAT_LIST');
        const isHigherLower = tradeType === 'HIGHERLOWER';
        ['1', '2'].forEach(index => {
            this.getField(`BARRIER_TYPE_${index}`)?.setVisible(isHigherLower);
            this.getField(`BARRIER_${index}`)?.setVisible(isHigherLower);
            this.getField(`STAKE_${index}`)?.setVisible(!isHigherLower);
            this.getField(`PREDICTION_${index}`)?.setVisible(!isHigherLower);
        });
        this.render();
    },
    customContextMenu(menu) {
        excludeOptionFromContextMenu(menu, [localize('Enable Block'), localize('Disable Block')]);
        modifyContextMenu(menu);
    },
    restricted_parents: ['before_purchase'],
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.purchase_hedge = block => {
    const first = block.getFieldValue('PURCHASE_1');
    const second = block.getFieldValue('PURCHASE_2');
    const firstStake = Number(block.getFieldValue('STAKE_1')) || 0.35;
    const secondStake = Number(block.getFieldValue('STAKE_2')) || 0.35;
    const firstPrediction = Number(block.getFieldValue('PREDICTION_1')) || 1;
    const secondPrediction = Number(block.getFieldValue('PREDICTION_2')) || 1;
    const firstBarrier = `${block.getFieldValue('BARRIER_TYPE_1')}${Number(block.getFieldValue('BARRIER_1')) || 0.31}`;
    const secondBarrier = `${block.getFieldValue('BARRIER_TYPE_2')}${Number(block.getFieldValue('BARRIER_2')) || 0.31}`;
    const tradeDefinition = block.workspace?.getTradeDefinitionBlock();
    const tradeType = tradeDefinition?.getChildByType('trade_definition_tradetype')?.getFieldValue('TRADETYPECAT_LIST');
    const firstOptions = tradeType === 'HIGHERLOWER' ? `, { barrierOffset: '${firstBarrier}' }` : `, { amount: ${firstStake} }`;
    const secondOptions = tradeType === 'HIGHERLOWER' ? `, { barrierOffset: '${secondBarrier}' }` : `, { amount: ${secondStake} }`;
    return `Bot.purchase('${first}'${firstOptions});\nBot.purchase('${second}'${secondOptions});\n`;
};
