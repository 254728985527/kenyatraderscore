const lightMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#ff6a00',
        colourSecondary: '#d95400',
        colourTertiary: '#a83f00',
    };

    workspace.Colours.Base = {
        colour: '#c7e7f7',
        colourSecondary: '#a9d3e8',
        colourTertiary: '#78aabd',
    };

    workspace.Colours.TradeParameters = {
        colour: '#c7e7f7',
        colourSecondary: '#a9d3e8',
        colourTertiary: '#78aabd',
    };

    workspace.Colours.Special1 = {
        colour: '#c7e7f7',
        colourSecondary: '#a9d3e8',
        colourTertiary: '#78aabd',
    };

    workspace.Colours.Special2 = {
        colour: '#c7e7f7',
        colourSecondary: '#a9d3e8',
        colourTertiary: '#78aabd',
    };

    workspace.Colours.Special3 = {
        colour: '#c7e7f7',
        colourSecondary: '#a9d3e8',
        colourTertiary: '#78aabd',
    };

    workspace.Colours.Special4 = {
        colour: '#c2e2f8',
        colourSecondary: '#000000',
        colourTertiary: '#0e0e0e',
    };
};

export const setColors = () => lightMode();
