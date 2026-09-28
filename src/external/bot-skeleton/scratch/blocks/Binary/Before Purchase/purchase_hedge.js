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
            message0: localize('Hedge purchase: %1 and %2'),
            args0: [
                { type: 'field_dropdown', name: 'PURCHASE_1', options: [['', '']] },
                { type: 'field_dropdown', name: 'PURCHASE_2', options: [['', '']] },
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
        if (event.type === window.Blockly.Events.BLOCK_CHANGE && ['TYPE_LIST', 'TRADETYPE_LIST'].includes(event.name)) {
            this.populateOptions(event);
        }
    },
    populateOptions(event) {
        const options = getOptions(this);
        ['PURCHASE_1', 'PURCHASE_2'].forEach(name => {
            const field = this.getField(name);
            field?.updateOptions(options, { default_value: field.getValue(), event_group: event.group, should_pretend_empty: true });
        });
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
    return `Bot.purchase('${first}');\nBot.purchase('${second}');\n`;
};
