import { Theme } from '@mui/material';

import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_ROOM_THEME } from './actionTypes';

export interface IRoomThemeState {

    /**
     * CSS custom properties of the current theme.
     */
    cssVariables?: Record<string, string>;

    /**
     * The MUI theme of the room. It is built once per change because replacing it restyles the whole app.
     */
    muiTheme?: Theme;
}

ReducerRegistry.register<IRoomThemeState>('features/room-theme', (state = {}, action): IRoomThemeState => {
    switch (action.type) {
    case SET_ROOM_THEME:
        return {
            cssVariables: action.cssVariables,
            muiTheme: action.muiTheme
        };
    }

    return state;
});
