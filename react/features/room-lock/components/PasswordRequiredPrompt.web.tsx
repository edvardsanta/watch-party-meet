import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../app/types';
import { setPassword } from '../../base/conference/actions';
import { IJitsiConference } from '../../base/conference/reducer';
import { translate } from '../../base/i18n/functions';
import Button from '../../base/ui/components/web/Button';
import Input from '../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../base/ui/constants.any';
import { _cancelPasswordRequiredPrompt } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link PasswordRequiredPrompt}.
 */
interface IProps extends WithTranslation {

    /**
     * The JitsiConference which requires a password.
     */
    conference: IJitsiConference;

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The type of the React {@code Component} state of
 * {@link PasswordRequiredPrompt}.
 */
interface IState {

    /**
     * The password entered by the local participant.
     */
    password?: string;
}

/**
 * Implements a React Component which prompts the user when a password is
 * required to join a conference.
 */
class PasswordRequiredPrompt extends Component<IProps, IState> {
    override state = {
        password: ''
    };

    /**
     * Initializes a new PasswordRequiredPrompt instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onPasswordChanged = this._onPasswordChanged.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { password } = this.state;
        const { t } = this.props;

        return (
            <div className = 'cinema-auth-screen'>
                <div className = 'cinema-auth-panel'>
                    <h1>{t('cinemaParty.auth.roomPasswordTitle')}</h1>
                    <p>{t('cinemaParty.auth.roomPasswordDescription')}</p>
                    <Input
                        autoFocus = { true }
                        className = 'dialog-bottom-margin'
                        id = 'required-password-input'
                        label = { t('cinemaParty.auth.roomPasswordLabel') }
                        name = 'lockKey'
                        onChange = { this._onPasswordChanged }
                        placeholder = { t('cinemaParty.auth.roomPasswordPlaceholder') }
                        type = 'password'
                        value = { password } />
                    <div className = 'cinema-auth-actions'>
                        <Button
                            accessibilityLabel = { t('cinemaParty.auth.unlockRoom') }
                            disabled = { !password }
                            labelKey = 'cinemaParty.auth.unlockRoom'
                            onClick = { this._onSubmit }
                            type = { BUTTON_TYPES.PRIMARY } />
                        <Button
                            accessibilityLabel = { t('dialog.Cancel') }
                            labelKey = 'dialog.Cancel'
                            onClick = { this._onCancel }
                            type = { BUTTON_TYPES.SECONDARY } />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Notifies this dialog that password has changed.
     *
     * @param {string} value - The details of the notification/event.
     * @private
     * @returns {void}
     */
    _onPasswordChanged(value: string) {
        this.setState({
            password: value
        });
    }

    /**
     * Dispatches action to cancel and dismiss this dialog.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(
            _cancelPasswordRequiredPrompt(this.props.conference));
    }

    /**
     * Dispatches action to submit value from this dialog.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { conference } = this.props;

        // We received that password is required, but user is trying anyway to
        // login without a password. Mark the room as not locked in case she
        // succeeds (maybe someone removed the password meanwhile). If it is
        // still locked, another password required will be received and the room
        // again will be marked as locked.
        this.props.dispatch(
            setPassword(conference, conference.join, this.state.password));

        // We have used the password so let's clean it.
        this.setState({
            password: ''
        });
    }
}

export default translate(connect()(PasswordRequiredPrompt));
