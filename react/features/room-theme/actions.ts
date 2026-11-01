import { Theme } from '@mui/material';

import { SET_ROOM_THEME } from './actionTypes';

/**
 * Applies the theme of the room to the UI.
 *
 * @param {Object} [cssVariables] - The CSS custom properties of the theme.
 * @param {Theme} [muiTheme] - The MUI theme.
 * @returns {Object} The action.
 */
export function setRoomTheme(cssVariables?: Record<string, string>, muiTheme?: Theme) {
    return {
        type: SET_ROOM_THEME,
        cssVariables,
        muiTheme
    };
}
