import { localize } from '@deriv-com/translations';

const dropdown = (name, options) => ({
    type: 'field_dropdown',
    name,
    options,
});

window.Blockly.Blocks.trade_definition_pool = {
    init() {
        this.jsonInit(this.definition());
        this.setInputsInline(true);
        this.setNextStatement(true);
        this.setPreviousStatement(true);
        this.setMovable(false);
    },
    definition() {
        return {
            message0: localize('Pool: %1 > %2 > Qualifying threshold (%): %3 > pool trade scope: %4 %5'),
            args0: [
                dropdown('POOL_TYPE', [
                    [localize('Target digit'), 'target_digit'],
                    [localize('Last digit'), 'last_digit'],
                ]),
                dropdown('DIGIT', [
                    ['0', '0'],
                    ['1', '1'],
                    ['2', '2'],
                    ['3', '3'],
                    ['4', '4'],
                    ['5', '5'],
                    ['6', '6'],
                    ['7', '7'],
                    ['8', '8'],
                    ['9', '9'],
                ]),
                dropdown('THRESHOLD', [
                    ['10%', '10'],
                    ['15%', '15'],
                    ['20%', '20'],
                ]),
                dropdown('SCOPE', [
                    [localize('All markets >15%'), 'all_markets_15'],
                    [localize('Selected market'), 'selected_market'],
                ]),
                {
                    type: 'field_checkbox',
                    name: 'ENABLED',
                    checked: true,
                },
            ],
            colour: window.Blockly.Colours.TradeParameters.colour,
            colourSecondary: window.Blockly.Colours.TradeParameters.colourSecondary,
            colourTertiary: window.Blockly.Colours.TradeParameters.colourTertiary,
            previousStatement: null,
            nextStatement: null,
            tooltip: localize('Configure the pool trade filter.'),
            category: window.Blockly.Categories.Trade_Definition,
        };
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_pool = () => '';
