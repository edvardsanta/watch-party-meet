import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getWatchSessionStatus } from '../../react/features/conference/components/web/watchSessionStatus';

const watching = {
    audioUnavailable: false,
    connectionInterrupted: false,
    hasPreviousPresenter: true,
    isChatOpen: false,
    isSharing: true,
    participantCount: 2,
    presenterInterrupted: false
};

test('a healthy transmission has no status overlay', () => {
    assert.deepEqual(getWatchSessionStatus(watching), {});
});

test('losing the connection takes priority over stopped sharing and missing audio', () => {
    assert.equal(getWatchSessionStatus({
        ...watching,
        audioUnavailable: true,
        connectionInterrupted: true,
        isSharing: false,
        participantCount: 1
    }).title, 'connectionInterrupted');
});

test('an interrupted stream takes priority over the audio warning', () => {
    assert.equal(getWatchSessionStatus({
        ...watching,
        audioUnavailable: true,
        presenterInterrupted: true
    }).title, 'presenterInterrupted');
});

test('ending a share or leaving the room tells the viewer to wait for the presenter', () => {
    for (const participantCount of [ 1, 2 ]) {
        assert.equal(getWatchSessionStatus({
            ...watching,
            isSharing: false,
            participantCount
        }).title, 'shareStopped');
    }
});

test('resuming sharing clears the stopped message', () => {
    assert.equal(getWatchSessionStatus({ ...watching, isSharing: false }).title, 'shareStopped');
    assert.deepEqual(getWatchSessionStatus(watching), {});
});

test('new sessions retain the original waiting and capacity hints', () => {
    const initial = { ...watching, hasPreviousPresenter: false, isSharing: false };

    assert.equal(getWatchSessionStatus(initial).title, 'waitingForShare');
    assert.equal(getWatchSessionStatus({ ...initial, participantCount: 1 }).title, 'waitingForGuest');
    assert.equal(getWatchSessionStatus({ ...initial, participantCount: 3 }).title, 'tooManyPeople');
});

test('audio warnings remain visible with the chat open and clear on recovery', () => {
    assert.equal(getWatchSessionStatus({
        ...watching,
        audioUnavailable: true,
        isChatOpen: true
    }).title, 'audioUnavailable');
    assert.equal(getWatchSessionStatus({ ...watching, isChatOpen: true }).title, 'chatOpen');
    assert.deepEqual(getWatchSessionStatus(watching), {});
});
