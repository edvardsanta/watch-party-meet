import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MIN_ACCENT_CONTRAST, ROOM_THEME_PRESETS } from '../../react/features/room-theme/constants';
import {
    getContrastWithWhite,
    getReadableAccent,
    parseRoomTheme,
    resolveRoomTheme
} from '../../react/features/room-theme/functions';

test('a known preset is accepted', () => {
    assert.deepEqual(parseRoomTheme({ id: 'horror' }), { id: 'horror' });
});

test('a valid custom accent is kept and normalized', () => {
    assert.deepEqual(parseRoomTheme({
        accent: '#AB12CD',
        id: 'epic'
    }), {
        accent: '#ab12cd',
        id: 'epic'
    });
});

test('values that are not a theme are rejected', () => {
    for (const value of [ undefined, null, 'horror', 42, [], {}, { id: 7 }, { id: 'unknown' } ]) {
        assert.equal(parseRoomTheme(value), undefined);
    }
});

test('inherited object keys are not presets', () => {
    for (const id of [ '__proto__', 'constructor', 'toString', 'hasOwnProperty' ]) {
        assert.equal(parseRoomTheme({ id }), undefined);
    }
});

test('an accent that could carry CSS is dropped but the preset stays', () => {
    for (const accent of [
        'red',
        '#fff',
        '#12345678',
        '#123456;background:url(https://example.com/x)',
        '#123456\n',
        ' #123456',
        'url(https://example.com/x)',
        123456
    ]) {
        assert.deepEqual(parseRoomTheme({
            accent,
            id: 'horror'
        }), { id: 'horror' });
    }
});

test('extra metadata fields are not carried over', () => {
    assert.deepEqual(parseRoomTheme({
        id: 'horror',
        injected: 'value'
    }), { id: 'horror' });
});

test('the regular look of the app needs no theme', () => {
    assert.equal(resolveRoomTheme(undefined), undefined);
    assert.equal(resolveRoomTheme({ id: 'default' }), undefined);
});

test('a custom accent also applies to the default preset', () => {
    const theme = resolveRoomTheme({
        accent: '#0f6b3a',
        id: 'default'
    });

    assert.equal(theme?.palette.action01, '#0f6b3a');
});

test('every preset is readable and uses dark backgrounds', () => {
    for (const [ id, preset ] of Object.entries(ROOM_THEME_PRESETS)) {
        assert.ok(getContrastWithWhite(preset.accent) >= MIN_ACCENT_CONTRAST, `${id} accent`);
        assert.ok(getContrastWithWhite(preset.background) >= 12, `${id} background`);
        assert.ok(getContrastWithWhite(preset.panel) >= 12, `${id} panel`);
        assert.ok(getContrastWithWhite(preset.surface) >= 7, `${id} surface`);
        assert.ok(getContrastWithWhite(preset.raised) >= 4.5, `${id} raised`);
    }
});

test('a light accent is darkened until white text is readable', () => {
    for (const accent of [ '#ffffff', '#ffff00', '#f2c14e', '#ffc0cb', '#00ffff' ]) {
        const readable = getReadableAccent(accent);

        assert.notEqual(readable, accent);
        assert.ok(getContrastWithWhite(readable) >= MIN_ACCENT_CONTRAST, accent);
    }
});

test('an accent that is already readable is not changed', () => {
    assert.equal(getReadableAccent('#b3121d'), '#b3121d');
    assert.equal(getReadableAccent('#000000'), '#000000');
});

test('a custom accent reaches primary actions and the backdrop', () => {
    const theme = resolveRoomTheme({
        accent: '#123456',
        id: 'horror'
    });

    assert.equal(theme?.palette.action01, '#123456');
    assert.equal(theme?.palette.surface01, ROOM_THEME_PRESETS.horror.background);
    assert.match(theme?.cssVariables['--wp-app-background'] ?? '', /#12345647/);
});
