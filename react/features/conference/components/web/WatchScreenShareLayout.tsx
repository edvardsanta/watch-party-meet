import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { VIDEO_TYPE } from '../../../base/media/constants';

const WATCH_SCREEN_SHARE_CLASS = 'watch-screen-share-active';

const hasActiveScreenShare = (state: IReduxState) =>
    state['features/base/tracks'].some(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted);

/**
 * Keeps the watch-party layout class in sync with remote and local screen shares.
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
