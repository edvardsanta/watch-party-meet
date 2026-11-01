import { DEFAULT_ROOM_THEME_ID, MIN_ACCENT_CONTRAST, ROOM_THEME_PRESETS } from './constants';
import { IResolvedRoomTheme, IRoomThemeSelection } from './types';

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;
const BLACK = '#000000';
const WHITE = '#ffffff';

/**
 * Splits a {@code #rrggbb} color into its channels.
 *
 * @param {string} color - The color.
 * @returns {Array<number>} The red, green and blue channels, from 0 to 255.
 */
function toChannels(color: string) {
    return [ 1, 3, 5 ].map(start => parseInt(color.slice(start, start + 2), 16));
}

/**
 * Mixes two {@code #rrggbb} colors.
 *
 * @param {string} color - The base color.
 * @param {string} other - The color to mix in.
 * @param {number} amount - How much of the other color to use, from 0 to 1.
 * @returns {string} The resulting color.
 */
function mix(color: string, other: string, amount: number) {
    const otherChannels = toChannels(other);
    const channels = toChannels(color).map((channel, index) =>
        Math.round(channel + ((otherChannels[index] - channel) * amount)));

    return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Calculates the WCAG relative luminance of a color.
 *
 * @param {string} color - The color, as {@code #rrggbb}.
 * @returns {number} The luminance, from 0 to 1.
 */
function getLuminance(color: string) {
    const [ red, green, blue ] = toChannels(color).map(channel => {
        const value = channel / 255;

        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

/**
 * Calculates the WCAG contrast ratio between a color and white.
 *
 * @param {string} color - The color, as {@code #rrggbb}.
 * @returns {number} The contrast ratio, from 1 to 21.
 */
export function getContrastWithWhite(color: string) {
    return 1.05 / (getLuminance(color) + 0.05);
}

/**
 * Darkens an accent until white text is readable on top of it.
 *
 * @param {string} accent - The accent, as {@code #rrggbb}.
 * @returns {string} The accent, unchanged if it was already readable.
 */
export function getReadableAccent(accent: string) {
    let readable = accent;

    for (let amount = 0.05; getContrastWithWhite(readable) < MIN_ACCENT_CONTRAST; amount += 0.05) {
        readable = mix(accent, BLACK, amount);
    }

    return readable;
}

/**
 * Validates a theme received from the conference metadata. Any moderator can publish that value and it ends up in
 * CSS, so only known presets and strict hex colors are accepted.
 *
 * @param {unknown} value - The value found in the metadata.
 * @returns {IRoomThemeSelection|undefined} A clean selection, or undefined when the value is not valid.
 */
export function parseRoomTheme(value: unknown): IRoomThemeSelection | undefined {
    if (typeof value !== 'object' || value === null) {
        return undefined;
    }

    const { accent, id } = value as Record<string, unknown>;

    if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(ROOM_THEME_PRESETS, id)) {
        return undefined;
    }

    if (typeof accent === 'string' && HEX_COLOR_REGEX.test(accent)) {
        return {
            accent: accent.toLowerCase(),
            id
        };
    }

    return { id };
}

/**
 * Converts a selection into the values applied to the UI.
 *
 * @param {IRoomThemeSelection} [selection] - The selection, already validated by {@link parseRoomTheme}.
 * @returns {IResolvedRoomTheme|undefined} The theme, or undefined when the regular look of the app should be kept.
 */
export function resolveRoomTheme(selection?: IRoomThemeSelection): IResolvedRoomTheme | undefined {
    if (!selection || (selection.id === DEFAULT_ROOM_THEME_ID && !selection.accent)) {
        return undefined;
    }

    const preset = ROOM_THEME_PRESETS[selection.id];
    const accent = getReadableAccent(selection.accent ?? preset.accent);
    const glow = selection.accent ?? preset.glow;

    return {
        cssVariables: {
            '--wp-accent': accent,
            '--wp-app-background': `radial-gradient(circle at 50% 0%, ${glow}47, transparent 34%), `
                + `linear-gradient(180deg, ${preset.panel} 0%, ${preset.background} 100%)`
        },
        palette: {
            action01: accent,
            active01: mix(accent, BLACK, 0.2),
            focus01: mix(glow, WHITE, 0.6),
            hover01: accent,
            hover05: preset.raised,
            surface01: preset.background,
            surface02: preset.panel,
            surface03: preset.surface,
            surface05: preset.raised
        }
    };
}
