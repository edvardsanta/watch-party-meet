import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { getParticipantCount } from '../../../base/participants/functions';

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

const hasActiveScreenShare = (state: IReduxState) =>
    state['features/base/tracks'].some(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted);

/**
 * Displays the small watch-party state over the shared stage.
 *
 * @returns {React.ReactElement}
 */
export default function WatchSessionStatus() {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const isChatOpen = useSelector((state: IReduxState) => state['features/chat'].isOpen);
    const isWatching = useSelector(hasActiveScreenShare);
    const participantCount = useSelector(getParticipantCount);

    if (participantCount > 2) {
        return (
            <div className = { classes.container }>
                <div
                    className = { classes.status }
                    data-testid = 'watch-party-session-status'>
                    <div className = { classes.title }>
                        {t('watchParty.status.tooManyPeople')}
                    </div>
                    <div className = { classes.description }>
                        {t('watchParty.status.twoPersonLimit')}
                    </div>
                </div>
            </div>
        );
    }

    if (participantCount < 2) {
        return (
            <div className = { classes.container }>
                <div
                    className = { classes.status }
                    data-testid = 'watch-party-session-status'>
                    <div className = { classes.title }>
                        {t('watchParty.status.waitingForGuest')}
                    </div>
                    <div className = { classes.description }>
                        {t('watchParty.status.inviteOnePerson')}
                    </div>
                </div>
            </div>
        );
    }

    if (isWatching && !isChatOpen) {
        return null;
    }

    const title = isWatching
        ? t('watchParty.status.chatOpen')
        : t('watchParty.status.waitingForShare');
    const description = isWatching
        ? undefined
        : t('watchParty.status.sharePrompt');

    return (
        <div className = { classes.container }>
            <div
                className = { classes.status }
                data-testid = 'watch-party-session-status'>
                <div className = { classes.title }>
                    {title}
                </div>
                {description && (
                    <div className = { classes.description }>
                        {description}
                    </div>
                )}
            </div>
        </div>
    );
}
