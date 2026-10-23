import { localize } from '@deriv-com/translations';
import { getContractTypeOptions } from '../../../shared';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

const EMPTY_OPTIONS = [['', '']];

window.Blockly.Blocks.purchase_pair = {
    init() {
        this.jsonInit(this.definition());
        this.setNextStatement(false);
        this.rebuildShape('compact');
    },
    definition() {
        return {
            message0: localize('Purchase 1: {{ contract_type }}', { contract_type: '%1' }),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PURCHASE_1',
                    options: EMPTY_OPTIONS,
                },
            ],
            message1: localize('Purchase 2: {{ contract_type }}', { contract_type: '%1' }),
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
            this.rebuildShape(this.getPurchaseMode());
        }
    },
    rebuildShape(mode) {
        if (this._purchasePairMode === mode && this.getInput('PURCHASE_1')) return;
        const savedValues = {};
        ['PURCHASE_1', 'PURCHASE_2', 'BARRIER_1', 'BARRIER_2', 'BARRIER_VALUE_1', 'BARRIER_VALUE_2', 'STAKE_1', 'STAKE_2', 'PREDICTION_1', 'PREDICTION_2'].forEach(name => {
            const field = this.getField(name);
            if (field) savedValues[name] = field.getValue();
        });
        this._purchasePairMode = mode;

        ['PURCHASE_1', 'PURCHASE_2', 'BARRIER_1', 'BARRIER_2', 'BARRIER_VALUE_1', 'BARRIER_VALUE_2', 'STAKE_1', 'STAKE_2', 'PREDICTION_1', 'PREDICTION_2'].forEach(name => {
            const input = this.getInput(name);
            if (input) this.removeInput(name, true);
        });

        const dropdown = (name, options) => new window.Blockly.FieldDropdown(options);
        const number = (name, value) => new window.Blockly.FieldNumber(value, 0);
        const purchaseOptions = [['Rise', 'RISE'], ['Fall', 'FALL'], ['Higher', 'HIGHER'], ['Lower', 'LOWER'], ['Only Ups', 'CALL'], ['Only Downs', 'PUT'], ['Over', 'DIGITOVER'], ['Under', 'DIGITUNDER']];

        const addRow = (index, options, extras) => {
            const input = this.appendDummyInput(`PURCHASE_${index}`)
                .appendField(`Purchase ${index}:`)
                .appendField(dropdown(`PURCHASE_${index}`, options), `PURCHASE_${index}`);
            extras(input, index);
        };

        if (mode === 'higher-lower') {
            addRow(1, [['Higher', 'HIGHER'], ['Lower', 'LOWER']], input => input
                .appendField('Barrier:')
                .appendField(dropdown('BARRIER_1', [['Offset', 'OFFSET']]), 'BARRIER_1')
                .appendField('Offset')
                .appendField(number('BARRIER_VALUE_1', 0.31), 'BARRIER_VALUE_1')
                .appendField('Stake 1')
                .appendField(number('STAKE_1', 0.35), 'STAKE_1'));
            addRow(2, [['Higher', 'HIGHER'], ['Lower', 'LOWER']], input => input
                .appendField('Barrier:')
                .appendField(dropdown('BARRIER_2', [['Offset', 'OFFSET']]), 'BARRIER_2')
                .appendField('Offset')
                .appendField(number('BARRIER_VALUE_2', 0.31), 'BARRIER_VALUE_2')
                .appendField('Stake 2')
                .appendField(number('STAKE_2', 0.35), 'STAKE_2'));
        } else if (mode === 'only-ups-downs') {
            addRow(1, [['Only Ups', 'CALL']], input => input.appendField('Stake 1').appendField(number('STAKE_1', 0.35), 'STAKE_1'));
            addRow(2, [['Only Downs', 'PUT']], input => input.appendField('Stake 2').appendField(number('STAKE_2', 0.35), 'STAKE_2'));
        } else if (mode === 'over-under') {
            addRow(1, [['Under', 'DIGITUNDER'], ['Over', 'DIGITOVER']], input => input.appendField('Stake 1').appendField(number('STAKE_1', 0.35), 'STAKE_1').appendField('Prediction').appendField(number('PREDICTION_1', 1), 'PREDICTION_1'));
            addRow(2, [['Under', 'DIGITUNDER'], ['Over', 'DIGITOVER']], input => input.appendField('Stake 2').appendField(number('STAKE_2', 0.35), 'STAKE_2').appendField('Prediction').appendField(number('PREDICTION_2', 1), 'PREDICTION_2'));
        } else {
            addRow(1, purchaseOptions, input => input);
            addRow(2, purchaseOptions, input => input);
        }
        this.setInputsInline(true);
        Object.entries(savedValues).forEach(([name, value]) => {
            const field = this.getField(name);
            if (field && value !== undefined && value !== '') {
                try {
                    field.setValue(value);
                } catch (error) {
                    // A mode-specific dropdown may not contain the previous value.
                }
            }
        });
    },
    getPurchaseMode() {
        const values = [this.getFieldValue('PURCHASE_1'), this.getFieldValue('PURCHASE_2')].map(value => String(value || '').toUpperCase());
        if (values.some(value => ['HIGHER', 'LOWER', 'HIGHLOW'].includes(value))) return 'higher-lower';
        if (values.some(value => ['CALL', 'PUT', 'ONLYUPS', 'ONLYDOWNS', 'UP', 'DOWN'].includes(value))) return 'only-ups-downs';
        if (values.some(value => ['DIGITOVER', 'DIGITUNDER', 'OVER', 'UNDER', 'OVERUNDER'].includes(value))) return 'over-under';
        return 'compact';
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
