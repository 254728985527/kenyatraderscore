import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';

const options = block => {
    const definition = block.workspace?.getTradeDefinitionBlock();
    return getContractTypeOptions(definition?.getChildByType('trade_definition_contracttype')?.getFieldValue('TYPE_LIST'), 'HIGHERLOWER');
};

window.Blockly.Blocks.purchase_higher_lower = {
    init() {
        this.jsonInit({ message0: localize('Purchase 1: %1 Barrier: Offset %2 %3'), message1: localize('Purchase 2: %1 Barrier: Offset %2 %3'), args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['', '']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_1', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_1', value: 0.31, min: 0, precision: 0.01 }], args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['', '']] }, { type: 'field_dropdown', name: 'BARRIER_TYPE_2', options: [['+', '+'], ['-', '-']] }, { type: 'field_number', name: 'BARRIER_2', value: 0.31, min: 0, precision: 0.01 }], previousStatement: null, colour: window.Blockly.Colours.Special1.colour, colourSecondary: window.Blockly.Colours.Special1.colourSecondary, colourTertiary: window.Blockly.Colours.Special1.colourTertiary });
    },
    onchange(event) { if (!this.workspace || window.Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) return; if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id) || event.type === window.Blockly.Events.BLOCK_CHANGE) { ['PURCHASE_1', 'PURCHASE_2'].forEach(name => this.getField(name)?.updateOptions(options(this), { default_value: this.getFieldValue(name), event_group: event.group, should_pretend_empty: true })); } },
    restricted_parents: ['before_purchase'],
};
window.Blockly.JavaScript.javascriptGenerator.forBlock.purchase_higher_lower = block => `Bot.purchase('${block.getFieldValue('PURCHASE_1')}', { barrierOffset: '${block.getFieldValue('BARRIER_TYPE_1')}${Number(block.getFieldValue('BARRIER_1')) || 0.31}' });\nBot.purchase('${block.getFieldValue('PURCHASE_2')}', { barrierOffset: '${block.getFieldValue('BARRIER_TYPE_2')}${Number(block.getFieldValue('BARRIER_2')) || 0.31}' });\n`;
window.Blockly.Blocks.purchase_higher_lower.meta = () => ({ display_name: localize('Higher/Lower hedge purchase'), description: localize('Purchases Higher and Lower contracts separately with independent barriers.') });
