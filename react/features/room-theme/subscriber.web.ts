import { Theme } from '@mui/material';

import { IReduxState } from '../app/types';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { createMuiBrandingTheme } from '../dynamic-branding/functions.web';

import { setRoomTheme } from './actions';
import { ROOM_THEME_METADATA_KEY } from './constants';
import { parseRoomTheme, resolveRoomTheme } from './functions';

/**
 * Applies the theme published in the conference metadata. The metadata is delivered when joining and on every update,
 * and it is cleared when leaving, which brings back the regular look of the app.
 */
StateListenerRegistry.register(
    (state: IReduxState) => state['features/base/conference'].metadata?.[ROOM_THEME_METADATA_KEY],
    (value, { dispatch }) => {
        const theme = resolveRoomTheme(parseRoomTheme(value));

        dispatch(setRoomTheme(
            theme?.cssVariables,
            theme && createMuiBrandingTheme({ palette: theme.palette } as unknown as Theme)
        ));
    },
    { deepEquals: true }
);
