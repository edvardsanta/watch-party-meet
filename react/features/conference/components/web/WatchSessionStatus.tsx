import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { JitsiConferenceEvents, JitsiTrackStreamingStatus } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../../base/media/constants';
import { isOnline } from '../../../base/net-info/selectors';
import { getParticipantCount } from '../../../base/participants/functions';

import { getWatchSessionStatus } from './watchSessionStatus';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'absolute',
            right: theme.spacing(2),
            bottom: theme.spacing(2),
            left: theme.spacing(2),
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,

            '@media (max-width: 480px)': {
                right: theme.spacing(1),
                bottom: 'calc(76px + env(safe-area-inset-bottom))',
                left: theme.spacing(1)
            }
        },

        status: {
            maxWidth: 'min(460px, 100%)',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, .54)',
            color: '#fff',
            boxSizing: 'border-box',
            padding: `${theme.spacing(0.75)} ${theme.spacing(1.25)}`,
            textAlign: 'center',
            backdropFilter: 'blur(6px)',

            '@media (max-width: 480px)': {
                maxWidth: '100%',
                padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`
            }
        },

        title: {
            ...theme.typography.bodyShortBold,
            lineHeight: '20px',

            '@media (max-width: 480px)': {
                fontSize: '13px',
                lineHeight: '18px'
            }
        },

        description: {
            ...theme.typography.bodyShortRegular,
            color: 'rgba(255, 255, 255, .78)',
            lineHeight: '18px',
            marginTop: '2px',

            '@media (max-width: 480px)': {
                fontSize: '12px',
                lineHeight: '16px'
            }
        }
    };
});

/**
 * Displays watch-party status without covering the shared screen with a dialog.
 *
 * @returns {React.ReactElement}
 */
export default function WatchSessionStatus() {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const isChatOpen = useSelector((state: IReduxState) => state['features/chat'].isOpen);
    const tracks = useSelector((state: IReduxState) => state['features/base/tracks']);
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const online = useSelector(isOnline);
    const participantCount = useSelector(getParticipantCount);
    const [ interrupted, setInterrupted ] = useState(false);
    const [ previousPresenter, setPreviousPresenter ] = useState<string>();
    const [ audioWarningFor, setAudioWarningFor ] = useState<string>();
    const screen = tracks.find(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted);
    const presenterId = screen && !screen.local ? screen.participantId : undefined;
    const presenterInterrupted = Boolean(presenterId
        && screen?.streamingStatus === JitsiTrackStreamingStatus.INTERRUPTED);
    const missingAudio = Boolean(presenterId && !tracks.some(track =>
        !track.local && track.participantId === presenterId
            && track.mediaType === MEDIA_TYPE.AUDIO && !track.muted));

    useEffect(() => {
        setInterrupted(conference?.isConnectionInterrupted() ?? false);
        setPreviousPresenter(undefined);

        if (!conference) {
            return;
        }

        const onInterrupted = () => setInterrupted(true);
        const onRestored = () => setInterrupted(false);

        conference.on(JitsiConferenceEvents.CONNECTION_INTERRUPTED, onInterrupted);
        conference.on(JitsiConferenceEvents.CONNECTION_RESTORED, onRestored);
        conference.on(JitsiConferenceEvents.CONNECTION_ESTABLISHED, onRestored);

        return () => {
            conference.off(JitsiConferenceEvents.CONNECTION_INTERRUPTED, onInterrupted);
            conference.off(JitsiConferenceEvents.CONNECTION_RESTORED, onRestored);
            conference.off(JitsiConferenceEvents.CONNECTION_ESTABLISHED, onRestored);
        };
    }, [ conference ]);

    useEffect(() => {
        if (presenterId) {
            setPreviousPresenter(presenterId);
        } else if (screen?.local) {
            setPreviousPresenter(undefined);
        }
    }, [ conference, presenterId, screen?.local ]);

    useEffect(() => {
        setAudioWarningFor(undefined);

        // Audio and video tracks can arrive separately. Never infer failure from silence.
        if (!missingAudio || interrupted || presenterInterrupted || online === false) {
            return;
        }

        const timeout = window.setTimeout(() => setAudioWarningFor(presenterId), 5000);

        return () => window.clearTimeout(timeout);
    }, [ conference, presenterId, missingAudio, interrupted, presenterInterrupted, online ]);

    const { title, description } = getWatchSessionStatus({
        audioUnavailable: missingAudio && audioWarningFor === presenterId,
        connectionInterrupted: online === false || interrupted,
        hasPreviousPresenter: Boolean(previousPresenter),
        isChatOpen,
        isSharing: Boolean(screen),
        participantCount,
        presenterInterrupted
    });

    return (
        <div className = { classes.container }>
            <div
                aria-atomic = { true }
                aria-live = 'polite'
                role = 'status'>
                {title && (
                    <div
                        className = { classes.status }
                        data-testid = 'watch-party-session-status'>
                        <div className = { classes.title }>
                            {t(`watchParty.status.${title}`)}
                        </div>
                        {description && (
                            <div className = { classes.description }>
                                {t(`watchParty.status.${description}`)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
