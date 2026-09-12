import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import { cancelWaitForOwner, login } from '../../actions.web';

/**
 * The type of the React {@code Component} props of {@link WaitForOwnerDialog}.
 */
interface IProps extends WithTranslation {

    /**
     * Whether to show alternative cancel button text.
     */
    _alternativeCancelText?: boolean;

    /**
     * Whether to hide the login button.
     */
    _hideLoginButton?: boolean;

    /**
     * Redux store dispatch method.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Authentication message dialog for host confirmation.
 *
 * @returns {React$Element<any>}
 */
class WaitForOwnerDialog extends PureComponent<IProps> {
    /**
     * Instantiates a new component.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._onCancelWaitForOwner = this._onCancelWaitForOwner.bind(this);
        this._onIAmHost = this._onIAmHost.bind(this);
    }

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelWaitForOwner() {
        const { dispatch } = this.props;

        dispatch(cancelWaitForOwner());
    }

    /**
     * Called when the OK button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onIAmHost() {
        this.props.dispatch(login());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            t
        } = this.props;

        return (
            <div className = 'watch-auth-screen'>
                <div className = 'watch-auth-panel'>
                    <h1>{t('watchParty.auth.waitingTitle')}</h1>
                    <p>
                        {this.props._hideLoginButton
                            ? t('watchParty.auth.waitingGuestDescription')
                            : t('watchParty.auth.waitingDescription')}
                    </p>
                    <div className = 'watch-auth-actions'>
                        {!this.props._hideLoginButton && (
                            <Button
                                accessibilityLabel = { t('watchParty.auth.hostLogin') }
                                labelKey = 'watchParty.auth.hostLogin'
                                onClick = { this._onIAmHost }
                                type = { BUTTON_TYPES.PRIMARY } />
                        )}
                        <Button
                            accessibilityLabel = { this.props._alternativeCancelText
                                ? t('watchParty.auth.waitAsGuest')
                                : t('dialog.Cancel') }
                            labelKey = { this.props._alternativeCancelText
                                ? 'watchParty.auth.waitAsGuest'
                                : 'dialog.Cancel' }
                            onClick = { this._onCancelWaitForOwner }
                            type = { BUTTON_TYPES.SECONDARY } />
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code WaitForOwnerDialog}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { membersOnly, lobbyWaitingForHost } = state['features/base/conference'];
    const { hideLoginButton } = state['features/base/config'];

    return {
        _alternativeCancelText: membersOnly && lobbyWaitingForHost,
        _hideLoginButton: hideLoginButton
    };
}

export default translate(connect(mapStateToProps)(WaitForOwnerDialog));
