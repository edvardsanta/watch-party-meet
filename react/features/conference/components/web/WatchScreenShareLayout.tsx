import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.any';

const WATCH_SCREEN_SHARE_CLASS = 'watch-screen-share-active';

const hasActiveScreenShare = (state: IReduxState) =>
    state['features/base/tracks'].some(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted)
        && getCurrentLayout(state) !== LAYOUTS.TILE_VIEW;

/**
 * Keeps the watch-party layout class in sync with remote and local screen shares.
 * The class is dropped while tile view is active so the participant tiles stay visible.
 *
 * @returns {null}
 */
export default function WatchScreenShareLayout() {
    const isScreenSharing = useSelector(hasActiveScreenShare);

    useEffect(() => {
        const conferencePage = document.getElementById('videoconference_page');

        if (!conferencePage) {
            return;
        }

        conferencePage.classList.toggle(WATCH_SCREEN_SHARE_CLASS, isScreenSharing);

        return () => {
            conferencePage.classList.remove(WATCH_SCREEN_SHARE_CLASS);
        };
    }, [ isScreenSharing ]);

    return null;
}
