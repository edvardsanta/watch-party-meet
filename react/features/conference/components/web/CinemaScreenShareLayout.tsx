import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { VIDEO_TYPE } from '../../../base/media/constants';

const CINEMA_SCREEN_SHARE_CLASS = 'cinema-screen-share-active';

const hasActiveScreenShare = (state: IReduxState) =>
    state['features/base/tracks'].some(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted);

/**
 * Keeps the cinema layout class in sync with remote and local screen shares.
 *
 * @returns {null}
 */
export default function CinemaScreenShareLayout() {
    const isScreenSharing = useSelector(hasActiveScreenShare);

    useEffect(() => {
        const conferencePage = document.getElementById('videoconference_page');

        if (!conferencePage) {
            return;
        }

        conferencePage.classList.toggle(CINEMA_SCREEN_SHARE_CLASS, isScreenSharing);

        return () => {
            conferencePage.classList.remove(CINEMA_SCREEN_SHARE_CLASS);
        };
    }, [ isScreenSharing ]);

    return null;
}
