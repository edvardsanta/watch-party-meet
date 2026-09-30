/**
 * Default gain applied to the shared-screen (system) audio before it is summed with the microphone. The system
 * audio is usually much louder than the processed (AGC/NS) microphone signal, so a unity-gain sum buries the voice.
 */
export const DEFAULT_SCREENSHARE_MIX_GAIN = 0.4;

type Listener = (gain: number) => void;

const listeners = new Set<Listener>();

let currentGain = DEFAULT_SCREENSHARE_MIX_GAIN;

/**
 * Returns the gain that new and running mixers should apply to the screen-share audio.
 *
 * @returns {number}
 */
export function getScreenshareMixGain() {
    return currentGain;
}

/**
 * Updates the screen-share mix gain and notifies the running mixers.
 *
 * @param {number} gain - The new gain, between 0 and 1.
 * @returns {void}
 */
export function setScreenshareMixGain(gain: number) {
    currentGain = Math.min(1, Math.max(0, gain));
    listeners.forEach(listener => listener(currentGain));
}

/**
 * Subscribes to gain changes.
 *
 * @param {Function} listener - Invoked with the new gain.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeScreenshareMixGain(listener: Listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}
