import {
    SET_SCREENSHARE_AUDIO_MIX_GAIN,
    SET_SCREENSHARE_CAPTURE_FRAME_RATE
} from './actionTypes';

/**
 * Sets how loud the shared-screen audio is in the mix sent to the other participants.
 *
 * @param {number} audioMixGain - The gain, between 0 and 1.
 * @returns {{
 *      type: SET_SCREENSHARE_AUDIO_MIX_GAIN,
 *      audioMixGain: number
 * }}
 */
export function setScreenshareAudioMixGain(audioMixGain: number) {
    return {
        type: SET_SCREENSHARE_AUDIO_MIX_GAIN,
        audioMixGain
    };
}

/**
 * Updates the capture frame rate for screenshare in redux.
 *
 * @param {number} captureFrameRate - The frame rate to be used for screenshare.
 * @returns {{
 *      type: SET_SCREENSHARE_CAPTURE_FRAME_RATE,
 *      captureFrameRate: number
 * }}
 */
export function setScreenshareFramerate(captureFrameRate: number) {
    return {
        type: SET_SCREENSHARE_CAPTURE_FRAME_RATE,
        captureFrameRate
    };
}
