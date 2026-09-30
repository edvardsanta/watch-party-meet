import { MEDIA_TYPE } from '../../base/media/constants';

/**
 * Gain applied to the shared-screen (system) audio before it is summed with the microphone. The system audio is
 * usually much louder than the processed (AGC/NS) microphone signal, so a unity-gain sum buries the voice.
 */
export const SCREENSHARE_AUDIO_MIX_GAIN = 0.4;

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * The AudioMixerEffect, as the name implies, mixes two JitsiLocalTracks containing a audio track. First track is
 * provided at the moment of creation, second is provided through the effect interface.
 */
export class AudioMixerEffect {
    /**
     * JitsiLocalTrack that is going to be mixed into the track that uses this effect.
     */
    _mixAudio: any;

    /**
     * MediaStream resulted from mixing.
     */
    _mixedMediaStream: any;

    /**
     * MediaStreamTrack obtained from mixed stream.
     */
    _mixedMediaTrack: Object;

    /**
     * Original MediaStream from the JitsiLocalTrack that uses this effect.
     */
    _originalStream: Object;

    /**
     * MediaStreamTrack obtained from the original MediaStream.
     */
    _originalTrack: any;

    /**
     * The WebAudio context of the mix graph.
     */
    _audioContext?: AudioContext;

    /**
     * The WebAudio nodes of the mix graph, kept so they can be disconnected when the effect stops.
     */
    _nodes: AudioNode[] = [];

    /**
     * Creates AudioMixerEffect.
     *
     * @param {JitsiLocalTrack} mixAudio - JitsiLocalTrack which will be mixed with the original track.
     */
    constructor(mixAudio: any) {
        if (mixAudio.getType() !== MEDIA_TYPE.AUDIO) {
            throw new Error('AudioMixerEffect only supports audio JitsiLocalTracks; effect will not work!');
        }

        this._mixAudio = mixAudio;
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: any) {
        // Both JitsiLocalTracks need to be audio i.e. contain an audio MediaStreamTrack
        return sourceLocalTrack.isAudioTrack() && this._mixAudio.isAudioTrack();
    }

    /**
     * Effect interface called by source JitsiLocalTrack, At this point a WebAudio ChannelMergerNode is created
     * and and the two associated MediaStreams are connected to it; the resulting mixed MediaStream is returned.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    // @ts-ignore
    startEffect(audioStream: MediaStream) {
        this._originalStream = audioStream;
        this._originalTrack = audioStream.getTracks()[0];

        const context = new AudioContext();
        const destination = context.createMediaStreamDestination();
        const micSource = context.createMediaStreamSource(this._originalStream as MediaStream);
        const screenSource = context.createMediaStreamSource(this._mixAudio.getOriginalStream());
        const screenGain = context.createGain();

        screenGain.gain.value = SCREENSHARE_AUDIO_MIX_GAIN;
        micSource.connect(destination);
        screenSource.connect(screenGain);
        screenGain.connect(destination);

        this._audioContext = context;
        this._nodes = [ micSource, screenSource, screenGain ];
        this._mixedMediaStream = destination.stream;
        this._mixedMediaTrack = this._mixedMediaStream.getTracks()[0];

        return this._mixedMediaStream;
    }

    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @returns {void}
     */
    stopEffect() {
        this._nodes.forEach(node => node.disconnect());
        this._nodes = [];
        this._audioContext?.close().catch(() => { /* already closed */ });
        this._audioContext = undefined;
    }

    /**
     * Change the muted state of the effect.
     *
     * @param {boolean} muted - Should effect be muted or not.
     * @returns {void}
     */
    setMuted(muted: boolean) {
        this._originalTrack.enabled = !muted;
    }

    /**
     * Check whether or not this effect is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return !this._originalTrack.enabled;
    }
}
