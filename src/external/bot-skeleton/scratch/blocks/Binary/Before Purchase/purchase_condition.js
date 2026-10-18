import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const PURCHASE_FIELDS = ['PURCHASE_1', 'PURCHASE_2'];
const CONFIG_FIELDS = ['BARRIER_1', 'BARRIER_2', 'BARRIER_OFFSET_1', 'BARRIER_OFFSET_2', 'STAKE_1', 'STAKE_2', 'PREDICTION_1', 'PREDICTION_2'];
const DEFAULTS = {
    BARRIER_1: 'Offset',
    BARRIER_2: 'Offset',
    BARRIER_OFFSET_1: '0.31',
    BARRIER_OFFSET_2: '0.31',
    STAKE_1: '0.35',
    STAKE_2: '0.35',
    PREDICTION_1: '1',
    PREDICTION_2: '1',
};

const input = (block, name, value = DEFAULTS[name]) =>
    block.appendDummyInput(name).appendField(localize(name.replace(/_/g, ' '))).appendField(new window.Blockly.FieldTextInput(value), name);

window.Blockly.Blocks.purchase_condition = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
        this._purchaseConditionMode = 'compact';
    },
    definition() {
        return {
            message0: localize('Purchase 1: {{ contract_type }}'),
            args0: [{ type: 'field_dropdown', name: 'PURCHASE_1', options: [['', '']] }],
            message1: localize('Purchase 2: {{ contract_type }}'),
            args1: [{ type: 'field_dropdown', name: 'PURCHASE_2', options: [['', '']] }],
            previousStatement: null,
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            tooltip: localize('Purchase two contracts of the selected types.'),
            category: window.Blockly.Categories.Before_Purchase,
        };
    },
    redesign() {
        if (!this.workspace) return;
        const label = this.getField('PURCHASE_1')?.getText()?.toLowerCase() || '';
        const mode = label.includes('higher') || label.includes('lower') ? 'higher_lower' : label.includes('ups') || label.includes('downs') ? 'ups_downs' : label.includes('over') || label.includes('under') ? 'over_under' : 'compact';
        if (mode === this._purchaseConditionMode && mode !== 'compact') return;
        ['DUMMY0', 'DUMMY1', ...CONFIG_FIELDS, 'HEDGE_ROW_1', 'HEDGE_ROW_2'].forEach(name => {
            if (this.getInput(name)) this.removeInput(name);
        });
        this._purchaseConditionMode = mode;
        if (mode === 'compact') return;
        this.setColour('#dce1e5');
        [1, 2].forEach(index => {
            const row = this.appendDummyInput(`HEDGE_ROW_${index}`)
                .appendField(localize(`Purchase ${index}:`))
                .appendField(new window.Blockly.FieldDropdown(this.getField('PURCHASE_' + index).menuGenerator_), `PURCHASE_${index}`);
            if (mode === 'higher_lower') {
                row.appendField(localize('Barrier:'))
                    .appendField(new window.Blockly.FieldDropdown([['Offset', 'Offset']]), `BARRIER_${index}`)
                    .appendField(new window.Blockly.FieldTextInput(DEFAULTS[`BARRIER_OFFSET_${index}`]), `BARRIER_OFFSET_${index}`)
                    .appendField('ⓘ')
                    .appendField(localize(`stake ${index}`))
                    .appendField(new window.Blockly.FieldTextInput(DEFAULTS[`STAKE_${index}`]), `STAKE_${index}`);
            } else {
                row.appendField(localize(`stake ${index}`)).appendField(new window.Blockly.FieldTextInput(DEFAULTS[`STAKE_${index}`]), `STAKE_${index}`);
                if (mode === 'over_under') row.appendField(localize('Prediction:')).appendField(new window.Blockly.FieldTextInput(DEFAULTS[`PREDICTION_${index}`]), `PREDICTION_${index}`);
            }
        });
        this.render();
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
        if (event.type === window.Blockly.Events.BLOCK_CHANGE && PURCHASE_FIELDS.includes(event.name)) {
            this.redesign();
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
