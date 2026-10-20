const lightMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#005b75',
        colourSecondary: '#00465a',
        colourTertiary: '#003746',
    };

    workspace.Colours.Base = {
        colour: '#c2e2f8',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special1 = {
        colour: '#c2e2f8',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special2 = {
        colour: '#c2e2f8',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special3 = {
        colour: '#c2e2f8',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special4 = {
        colour: '#c2e2f8',
        colourSecondary: '#000000',
        colourTertiary: '#0e0e0e',
    };
};

export const setColors = () => lightMode();
