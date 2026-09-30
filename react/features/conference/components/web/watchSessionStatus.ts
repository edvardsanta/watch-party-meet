interface IWatchSessionState {
    audioUnavailable: boolean;
    connectionInterrupted: boolean;
    hasPreviousPresenter: boolean;
    isChatOpen: boolean;
    isSharing: boolean;
    participantCount: number;
    presenterInterrupted: boolean;
}

/**
 * Chooses the most useful status, prioritizing connection failures over room hints.
 *
 * @param {IWatchSessionState} state - Current viewer and room state.
 * @returns {Object} Translation keys for the status.
 */
export function getWatchSessionStatus(state: IWatchSessionState): { description?: string; title?: string; } {
    if (state.connectionInterrupted) {
        return { title: 'connectionInterrupted', description: 'connectionInterruptedHint' };
    }
    if (state.presenterInterrupted) {
        return { title: 'presenterInterrupted', description: 'presenterInterruptedHint' };
    }
    if (!state.isSharing && state.hasPreviousPresenter) {
        return { title: 'shareStopped', description: 'shareStoppedHint' };
    }
    if (state.participantCount > 2) {
        return { title: 'tooManyPeople', description: 'twoPersonLimit' };
    }
    if (state.participantCount < 2) {
        return { title: 'waitingForGuest', description: 'inviteOnePerson' };
    }
    if (state.audioUnavailable) {
        return { title: 'audioUnavailable', description: 'audioUnavailableHint' };
    }
    if (!state.isSharing) {
        return { title: 'waitingForShare', description: 'sharePrompt' };
    }
    if (state.isChatOpen) {
        return { title: 'chatOpen' };
    }

    return {};
}
