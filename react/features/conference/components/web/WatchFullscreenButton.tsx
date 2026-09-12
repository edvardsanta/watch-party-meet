import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '../../../base/icons/components/Icon';
import { IconEnterFullscreen } from '../../../base/icons/svg';

const requestElementFullscreen = async (element?: HTMLElement | null) => {
    const target = element as any;

    if (!target) {
        return false;
    }

    if (typeof target.requestFullscreen === 'function') {
        await target.requestFullscreen();

        return true;
    }

    if (typeof target.webkitRequestFullscreen === 'function') {
        target.webkitRequestFullscreen();

        return true;
    }

    return false;
};

const requestVideoFullscreen = () => {
    const video = document.getElementById('largeVideo') as any;

    if (video && typeof video.webkitEnterFullscreen === 'function') {
        video.webkitEnterFullscreen();

        return true;
    }

    return false;
};

/**
 * Displays a focused fullscreen action for the shared screen surface.
 *
 * @returns {React.ReactElement | null}
 */
export default function WatchFullscreenButton() {
    const { t } = useTranslation();

    const onClick = useCallback(async () => {
        const target = document.getElementById('largeVideoContainer')
            || document.getElementById('largeVideoWrapper')
            || document.getElementById('videospace');

        const enteredFullscreen = await requestElementFullscreen(target);

        if (!enteredFullscreen) {
            requestVideoFullscreen();
        }
    }, []);

    return (
        <button
            aria-label = { t('watchParty.fullscreen.enter') }
            className = 'watch-fullscreen-button'
            onClick = { onClick }
            type = 'button'>
            <Icon
                size = { 20 }
                src = { IconEnterFullscreen } />
        </button>
    );
}
