import React from 'react';
import { useSelector } from 'react-redux';
import { GlobalStyles as MUIGlobalStyles } from 'tss-react';
import { useStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { commonStyles } from '../constants';

/**
 * A component generating all the global styles.
 *
 * @returns {void}
 */
function GlobalStyles() {
    const { theme } = useStyles();
    const roomThemeVariables = useSelector((state: IReduxState) => state['features/room-theme'].cssVariables);
    const styles = commonStyles(theme);

    return (
        <MUIGlobalStyles
            styles = {{
                ...styles,
                ':root': {
                    ...styles[':root'],
                    ...roomThemeVariables
                }
            }} />
    );
}

export default GlobalStyles;
