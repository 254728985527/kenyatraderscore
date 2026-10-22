import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const EMPTY_OPTIONS = [['', '']];

window.Blockly.Blocks.purchase_pair = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Purchase 1: {{ contract_type }}'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PURCHASE_1',
                    options: EMPTY_OPTIONS,
                },
            ],
            message1: localize('Purchase 2: {{ contract_type }}'),
            args1: [
                {
                    type: 'field_dropdown',
                    name: 'PURCHASE_2',
                    options: EMPTY_OPTIONS,
                },
            ],
            previousStatement: null,
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            tooltip: localize('Purchase two contracts when the purchase conditions are met.'),
            category: window.Blockly.Categories.Before_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Purchase 1 and 2'),
            description: localize('Purchases two selected contracts together inside the Purchase conditions block.'),
            key_words: localize('buy multiple'),
        };
    },
    onchange(event) {
        if (!this.workspace || window.Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) return;

        if (
            (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) ||
            event.type === window.Blockly.Events.BLOCK_CHANGE
        ) {
            this.populatePurchaseLists(event);
        }
    },
    populatePurchaseLists(event) {
        const trade_definition_block = this.workspace.getTradeDefinitionBlock();
        if (!trade_definition_block) return;

        const trade_type_block = trade_definition_block.getChildByType('trade_definition_tradetype');
        const contract_type_block = trade_definition_block.getChildByType('trade_definition_contracttype');
        if (!trade_type_block || !contract_type_block) return;

        const options = getContractTypeOptions(
            contract_type_block.getFieldValue('TYPE_LIST'),
            trade_type_block.getFieldValue('TRADETYPE_LIST')
        );

        ['PURCHASE_1', 'PURCHASE_2'].forEach(name => {
            const field = this.getField(name);
            const current_value = field.getValue();
            field.updateOptions(options, {
                default_value: current_value,
                event_group: event.group,
                should_pretend_empty: true,
            });
        });
    },
    customContextMenu(menu) {
        const menu_items = [localize('Enable Block'), localize('Disable Block')];
        excludeOptionFromContextMenu(menu, menu_items);
        modifyContextMenu(menu);
    },
    restricted_parents: ['before_purchase'],
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.purchase_pair = block => {
    const purchase_1 = block.getFieldValue('PURCHASE_1');
    const purchase_2 = block.getFieldValue('PURCHASE_2');
    return `Bot.purchase('${purchase_1}');\nBot.purchase('${purchase_2}');\n`;
};
