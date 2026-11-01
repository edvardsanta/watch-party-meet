/**
 * The theme selected for a room, as published in the conference metadata.
 */
export interface IRoomThemeSelection {

    /**
     * Optional accent color overriding the one from the preset, formatted as {@code #rrggbb}.
     */
    accent?: string;

    /**
     * The identifier of the preset, one of the keys of {@code ROOM_THEME_PRESETS}.
     */
    id: string;
}

/**
 * The colors defining a room theme. Every background is dark on purpose: most of the UI hardcodes white text.
 */
export interface IRoomThemePreset {

    /**
     * Color of primary actions. It sits under white text, so it is darkened when the contrast is too low.
     */
    accent: string;

    /**
     * The page background.
     */
    background: string;

    /**
     * The soft light at the top of the stage.
     */
    glow: string;

    /**
     * Background of panels such as the toolbox, the chat and dialogs.
     */
    panel: string;

    /**
     * Background of elements raised above the surfaces, such as hover states and local chat messages.
     */
    raised: string;

    /**
     * Background of elements placed on panels, such as inputs and the stage placeholder.
     */
    surface: string;
}

/**
 * Everything needed to apply a room theme to the UI.
 */
export interface IResolvedRoomTheme {

    /**
     * CSS custom properties for the styles that do not read the MUI theme.
     */
    cssVariables: Record<string, string>;

    /**
     * Palette overrides for the MUI theme.
     */
    palette: Record<string, string>;
}
