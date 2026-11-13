import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconEnterFullscreen, IconExitFullscreen } from '../../../base/icons/svg';
import { setFullScreen, showToolbox } from '../../../toolbox/actions.web';

/**
 * Whether the browser can put the whole page in fullscreen, which keeps the toolbar and the chat reachable.
 *
 * @returns {boolean}
 */
const isPageFullscreenSupported = () => {
    const { fullscreenEnabled, webkitFullscreenEnabled }
        = document as Document & { webkitFullscreenEnabled?: boolean; };

    return Boolean(fullscreenEnabled || webkitFullscreenEnabled);
};

/**
 * Keeps a tap on the button from also counting as a tap on the video, which would toggle the toolbar.
 *
 * @param {React.TouchEvent} event - The touch event.
 * @returns {void}
 */
const stopTouchPropagation = (event: React.TouchEvent) => event.stopPropagation();

/**
 * Displays a focused action to enter and leave fullscreen.
 *
 * Browsers that can only make a video fullscreen, such as Safari on iPhone, do not get the button: their native player
 * would cover the microphone and the chat, while the video already fills the page.
 *
 * @returns {React.ReactElement | null}
 */
export default function WatchFullscreenButton() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isFullScreen = useSelector((state: IReduxState) => Boolean(state['features/toolbox'].fullScreen));

    const onClick = useCallback(() => {
        dispatch(setFullScreen(!isFullScreen));
        dispatch(showToolbox());
    }, [ dispatch, isFullScreen ]);

    if (!isPageFullscreenSupported()) {
        return null;
    }

    return (
        <button
            aria-label = { t(`watchParty.fullscreen.${isFullScreen ? 'exit' : 'enter'}`) }
            className = 'watch-fullscreen-button'
            onClick = { onClick }
            onTouchStart = { stopTouchPropagation }
            type = 'button'>
            <Icon
                size = { 20 }
                src = { isFullScreen ? IconExitFullscreen : IconEnterFullscreen } />
        </button>
    );
}
