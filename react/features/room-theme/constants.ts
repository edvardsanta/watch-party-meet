import { IRoomThemePreset } from './types';

/**
 * The conference metadata key holding the theme of the room.
 */
export const ROOM_THEME_METADATA_KEY = 'watchPartyTheme';

/**
 * The preset that keeps the regular look of the app.
 */
export const DEFAULT_ROOM_THEME_ID = 'default';

/**
 * The accent offered when a moderator enables the custom color before choosing one.
 */
export const DEFAULT_CUSTOM_ACCENT = '#4687ed';

/**
 * The minimum contrast between an accent and the white text placed on top of it (WCAG AA).
 */
export const MIN_ACCENT_CONTRAST = 4.5;

/**
 * The available presets, in the order they are offered.
 */
export const ROOM_THEME_PRESETS: Record<string, IRoomThemePreset> = {
    [DEFAULT_ROOM_THEME_ID]: {
        accent: '#246fe5',
        background: '#040404',
        glow: '#4687ed',
        panel: '#141414',
        raised: '#525252',
        surface: '#292929'
    },
    fairytale: {
        accent: '#6d4ae0',
        background: '#070b24',
        glow: '#f2c14e',
        panel: '#101640',
        raised: '#2c3a8c',
        surface: '#1a2260'
    },
    horror: {
        accent: '#b3121d',
        background: '#080404',
        glow: '#8a0f16',
        panel: '#160808',
        raised: '#4a1818',
        surface: '#2a0e0e'
    },
    epic: {
        accent: '#946614',
        background: '#06141b',
        glow: '#d4a24c',
        panel: '#0d2230',
        raised: '#27506b',
        surface: '#16354a'
    },
    princess: {
        accent: '#b0359a',
        background: '#160a26',
        glow: '#f4b6e0',
        panel: '#241239',
        raised: '#563580',
        surface: '#38205a'
    },
    pinkGlam: {
        accent: '#d1147a',
        background: '#1a0512',
        glow: '#ff5fb0',
        panel: '#2c0a1f',
        raised: '#6e1a50',
        surface: '#471033'
    }
};
