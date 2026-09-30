import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { DEFAULT_SCREENSHARE_MIX_GAIN } from '../../../stream-effects/audio-mixer/screenshareMixGain';
import VolumeSlider from '../../../video-menu/components/web/VolumeSlider';
import { setScreenshareAudioMixGain } from '../../actions.any';

/**
 * Slider which lets the sharer choose how loud the shared-screen audio is, relative to the microphone, in what the
 * other participants hear. Rendered only while a screen-share audio track exists.
 *
 * @returns {ReactElement|null}
 */
const ScreenShareAudioLevelSlider = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const hasScreenAudio = useSelector((state: IReduxState) => Boolean(state['features/screen-share'].desktopAudioTrack));
    const gain = useSelector((state: IReduxState) =>
        state['features/screen-share'].audioMixGain ?? DEFAULT_SCREENSHARE_MIX_GAIN);
    const onChange = useCallback((value: number) => {
        dispatch(setScreenshareAudioMixGain(value));
    }, [ dispatch ]);

    if (!hasScreenAudio) {
        return null;
    }

    return (
        <VolumeSlider
            initialValue = { gain }
            label = { t('screenShareAudioLevel') }
            onChange = { onChange } />
    );
};

export default ScreenShareAudioLevelSlider;
