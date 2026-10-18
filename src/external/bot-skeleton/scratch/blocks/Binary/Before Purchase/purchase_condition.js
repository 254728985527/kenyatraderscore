import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const PURCHASE_FIELDS = ['PURCHASE_1', 'PURCHASE_2'];

window.Blockly.Blocks.purchase_condition = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Purchase 1: {{ contract_type }}'),
            args0: [
                { type: 'field_dropdown', name: 'PURCHASE_1', options: [['', '']] },
            ],
            message1: localize('Purchase 2: {{ contract_type }}'),
            args1: [
                { type: 'field_dropdown', name: 'PURCHASE_2', options: [['', '']] },
            ],
            previousStatement: null,
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            tooltip: localize('Purchase two contracts of the selected types.'),
            category: window.Blockly.Categories.Before_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Purchase condition'),
            description: localize('Use this block to purchase two selected contract types within the Purchase conditions block.'),
            key_words: localize('buy purchase condition'),
        };
    },
    onchange(event) {
        if (!this.workspace || window.Blockly.derivWorkspace.isFlyoutVisible || this.workspace.isDragging()) return;

        if (
            (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) ||
            (event.type === window.Blockly.Events.BLOCK_CHANGE &&
                (event.name === 'TYPE_LIST' || event.name === 'TRADETYPE_LIST'))
        ) {
            this.populatePurchaseLists(event);
        }
    },
    populatePurchaseLists(event) {
        const tradeDefinitionBlock = this.workspace.getTradeDefinitionBlock();
        if (!tradeDefinitionBlock) return;

        const tradeTypeBlock = tradeDefinitionBlock.getChildByType('trade_definition_tradetype');
        const contractTypeBlock = tradeDefinitionBlock.getChildByType('trade_definition_contracttype');
        if (!tradeTypeBlock || !contractTypeBlock) return;

        const options = getContractTypeOptions(
            contractTypeBlock.getFieldValue('TYPE_LIST'),
            tradeTypeBlock.getFieldValue('TRADETYPE_LIST')
        );

        PURCHASE_FIELDS.forEach(name => {
            const field = this.getField(name);
            const currentValue = field.getValue();
            field.updateOptions(options, {
                default_value: currentValue,
                event_group: event.group,
                should_pretend_empty: true,
            });
        });
    },
    customContextMenu(menu) {
        excludeOptionFromContextMenu(menu, [localize('Enable Block'), localize('Disable Block')]);
        modifyContextMenu(menu);
    },
    restricted_parents: ['before_purchase'],
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.purchase_condition = block =>
    `${PURCHASE_FIELDS.map(name => `Bot.purchase('${block.getFieldValue(name)}');`).join('\\n')}\\n`;
