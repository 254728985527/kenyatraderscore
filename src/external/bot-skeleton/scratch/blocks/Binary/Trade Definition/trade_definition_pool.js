import { localize } from '@deriv-com/translations';
import { excludeOptionFromContextMenu, modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.trade_definition_pool = {
    init() {
        this.jsonInit({
            message0: localize('Pool: {{ pool_type }} > {{ pool_digit }} > Qualifying threshold (%): {{ threshold }} > pool trade scope: {{ scope }} {{ enabled }}', {
                pool_type: '%1',
                pool_digit: '%2',
                threshold: '%3',
                scope: '%4',
                enabled: '%5',
            }),
            args0: [
                { type: 'field_dropdown', name: 'POOL_TYPE', options: [[localize('Target digit'), 'TARGET_DIGIT'], [localize('Last digit'), 'LAST_DIGIT']] },
                { type: 'field_dropdown', name: 'POOL_DIGIT', options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9']] },
                { type: 'field_dropdown', name: 'POOL_THRESHOLD', options: [['10%', '10'], ['15%', '15'], ['20%', '20'], ['25%', '25']] },
                { type: 'field_dropdown', name: 'POOL_SCOPE', options: [[localize('All markets >15%'), 'ALL_MARKETS_15'], [localize('Selected market'), 'SELECTED_MARKET']] },
                { type: 'field_checkbox', name: 'POOL_ENABLED', checked: true },
            ],
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            inputsInline: true,
            previousStatement: null,
            nextStatement: null,
        });
        this.setMovable(false);
        this.setDeletable(false);
    },
    customContextMenu(menu) {
        excludeOptionFromContextMenu(menu, [localize('Enable Block'), localize('Disable Block')]);
        modifyContextMenu(menu);
    },
};
