import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Select from '../../../base/ui/components/web/Select';
import { DEFAULT_CUSTOM_ACCENT, ROOM_THEME_PRESETS } from '../../../room-theme/constants';

/**
 * The type of the React {@code Component} props of {@link ModeratorTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {
    /**
     * Whether the user has selected the audio moderation feature to be enabled.
     */
    audioModerationEnabled: boolean;

    /**
     * Whether audio translation is enabled for the room.
     */
    audioTranslationEnabled: boolean;

    /**
     * Whether the user has selected the chat with permissions feature to be enabled.
     */
    chatWithPermissionsEnabled: boolean;

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * If set hides the reactions moderation setting.
     */
    disableReactionsModeration: boolean;

    /**
     * Whether or not follow me is currently active (enabled by some other participant).
     */
    followMeActive: boolean;

    /**
     * Whether or not the user has selected the Follow Me feature to be enabled.
     */
    followMeEnabled: boolean;

    /**
     * Whether follow me for recorder is currently active (enabled by some other participant).
     */
    followMeRecorderActive: boolean;

    /**
     * Whether the user has selected the Follow Me Recorder feature to be enabled.
     */
    followMeRecorderEnabled: boolean;

    /**
     * Whether to hide chat with permissions.
     */
    hideChatWithPermissions: boolean;

    /**
     * The custom accent color of the room theme, as {@code #rrggbb}.
     */
    roomThemeAccent?: string;

    /**
     * The preset selected as the room theme.
     */
    roomThemeId: string;

    /**
     * Whether the audio-translation room toggle should be shown (i.e. the feature is deployed).
     */
    showAudioTranslation: boolean;

    /**
     * Whether the room theme can be changed, which depends on the room metadata component of the backend.
     */
    showRoomTheme: boolean;

    /**
     * Whether or not the user has selected the Start Audio Muted feature to be
     * enabled.
     */
    startAudioMuted: boolean;

    /**
     * Whether or not the user has selected the Start Reactions Muted feature to be
     * enabled.
     */
    startReactionsMuted: boolean;

    /**
     * Whether or not the user has selected the Start Video Muted feature to be
     * enabled.
     */
    startVideoMuted: boolean;

    /**
     * Whether the user has selected the video moderation feature to be enabled.
     */
    videoModerationEnabled: boolean;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const
        },

        title: {
            ...theme.typography.heading6,
            color: `${theme.palette.settingsTabText} !important`,
            marginBottom: theme.spacing(3)
        },

        checkbox: {
            marginBottom: theme.spacing(3)
        },

        roomTheme: {
            marginBottom: theme.spacing(3)
        },

        roomThemeAccent: {
            ...theme.typography.bodyShortRegular,
            alignItems: 'center',
            color: theme.palette.settingsTabText,
            display: 'flex',
            gap: theme.spacing(2),
            marginBottom: theme.spacing(3)
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class ModeratorTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code ModeratorTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onStartAudioMutedChanged = this._onStartAudioMutedChanged.bind(this);
        this._onStartVideoMutedChanged = this._onStartVideoMutedChanged.bind(this);
        this._onStartReactionsMutedChanged = this._onStartReactionsMutedChanged.bind(this);
        this._onFollowMeEnabledChanged = this._onFollowMeEnabledChanged.bind(this);
        this._onFollowMeRecorderEnabledChanged = this._onFollowMeRecorderEnabledChanged.bind(this);
        this._onChatWithPermissionsChanged = this._onChatWithPermissionsChanged.bind(this);
        this._onAudioTranslationEnabledChanged = this._onAudioTranslationEnabledChanged.bind(this);
        this._onRoomThemeChanged = this._onRoomThemeChanged.bind(this);
        this._onRoomThemeAccentEnabledChanged = this._onRoomThemeAccentEnabledChanged.bind(this);
        this._onRoomThemeAccentChanged = this._onRoomThemeAccentChanged.bind(this);
    }

    /**
     * Callback invoked to select the preset of the room theme.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onRoomThemeChanged({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) {
        super._onChange({ roomThemeId: value });
    }

    /**
     * Callback invoked to enable or disable the custom accent color of the room theme.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onRoomThemeAccentEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ roomThemeAccent: checked ? DEFAULT_CUSTOM_ACCENT : undefined });
    }

    /**
     * Callback invoked to select the custom accent color of the room theme.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onRoomThemeAccentChanged({ target: { value } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ roomThemeAccent: value });
    }

    /**
     * Callback invoked to enable or disable audio translation for the whole room.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onAudioTranslationEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ audioTranslationEnabled: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with audio muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartAudioMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startAudioMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with video disabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartVideoMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startVideoMuted: checked });
    }

    /**
     * Callback invoked to select if conferences should start
     * with reactions muted.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onStartReactionsMutedChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ startReactionsMuted: checked });
    }

    /**
     * Callback invoked to select if follow-me mode
     * should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({
            followMeEnabled: checked,
            followMeRecorderEnabled: checked ? false : undefined
        });
    }

    /**
     * Callback invoked to select if follow-me for recorder mode should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onFollowMeRecorderEnabledChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({
            followMeEnabled: checked ? false : undefined,
            followMeRecorderEnabled: checked
        });
    }

    /**
     * Callback invoked to select if chat with permissions should be activated.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onChatWithPermissionsChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ chatWithPermissionsEnabled: checked });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            audioModerationEnabled,
            audioTranslationEnabled,
            chatWithPermissionsEnabled,
            disableReactionsModeration,
            followMeActive,
            followMeEnabled,
            followMeRecorderActive,
            followMeRecorderEnabled,
            hideChatWithPermissions,
            roomThemeAccent,
            roomThemeId,
            showAudioTranslation,
            showRoomTheme,
            startAudioMuted,
            startVideoMuted,
            startReactionsMuted,
            t,
            videoModerationEnabled
        } = this.props;
        const classes = withStyles.getClasses(this.props);

        const followMeRecorderChecked = followMeRecorderEnabled && !followMeRecorderActive;

        return (
            <div
                className = { `moderator-tab ${classes.container}` }
                key = 'moderator'>
                <h2 className = { classes.title }>
                    {t('settings.moderatorOptions')}
                </h2>
                { !audioModerationEnabled && <Checkbox
                    checked = { startAudioMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startAudioMuted') }
                    name = 'start-audio-muted'
                    onChange = { this._onStartAudioMutedChanged } /> }
                { !videoModerationEnabled && <Checkbox
                    checked = { startVideoMuted }
                    className = { classes.checkbox }
                    label = { t('settings.startVideoMuted') }
                    name = 'start-video-muted'
                    onChange = { this._onStartVideoMutedChanged } /> }
                <Checkbox
                    checked = { followMeEnabled && !followMeActive && !followMeRecorderChecked }
                    className = { classes.checkbox }
                    disabled = { followMeActive || followMeRecorderActive }
                    label = { t('settings.followMe') }
                    name = 'follow-me'
                    onChange = { this._onFollowMeEnabledChanged } />
                <Checkbox
                    checked = { followMeRecorderChecked }
                    className = { classes.checkbox }
                    disabled = { followMeRecorderActive || followMeActive }
                    label = { t('settings.followMeRecorder') }
                    name = 'follow-me-recorder'
                    onChange = { this._onFollowMeRecorderEnabledChanged } />
                { !disableReactionsModeration
                        && <Checkbox
                            checked = { startReactionsMuted }
                            className = { classes.checkbox }
                            label = { t('settings.startReactionsMuted') }
                            name = 'start-reactions-muted'
                            onChange = { this._onStartReactionsMutedChanged } /> }
                { !hideChatWithPermissions
                    && <Checkbox
                        checked = { chatWithPermissionsEnabled }
                        className = { classes.checkbox }
                        label = { t('settings.chatWithPermissions') }
                        name = 'chat-with-permissions'
                        onChange = { this._onChatWithPermissionsChanged } /> }
                { showAudioTranslation
                    && <Checkbox
                        checked = { audioTranslationEnabled }
                        className = { classes.checkbox }
                        label = { t('settings.audioTranslation') }
                        name = 'audio-translation'
                        onChange = { this._onAudioTranslationEnabledChanged } /> }
                { showRoomTheme && <>
                    <Select
                        className = { classes.roomTheme }
                        id = 'room-theme'
                        label = { t('settings.roomTheme') }
                        onChange = { this._onRoomThemeChanged }
                        options = { Object.keys(ROOM_THEME_PRESETS).map(id => {
                            return {
                                label: t(`settings.roomThemes.${id}`),
                                value: id
                            };
                        }) }
                        value = { roomThemeId } />
                    <Checkbox
                        checked = { Boolean(roomThemeAccent) }
                        className = { classes.checkbox }
                        label = { t('settings.roomThemeCustomAccent') }
                        name = 'room-theme-custom-accent'
                        onChange = { this._onRoomThemeAccentEnabledChanged } />
                    { roomThemeAccent
                        && <label className = { classes.roomThemeAccent }>
                            <input
                                onChange = { this._onRoomThemeAccentChanged }
                                type = 'color'
                                value = { roomThemeAccent } />
                            { t('settings.roomThemeAccent') }
                        </label> }
                </> }
            </div>
        );
    }
}

export default withStyles(translate(ModeratorTab), styles);
