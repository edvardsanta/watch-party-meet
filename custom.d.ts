declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}

declare module '*.svg' {
    const content: any;
    export default content;
}

declare module '*.svg?raw' {
    const content: string;
    export default content;
}

declare module '@tensorflow-models/body-segmentation' {
    export enum SupportedModels {
        BodyPix = 'BodyPix',
        MediaPipeSelfieSegmentation = 'MediaPipeSelfieSegmentation'
    }

    export interface MediaPipeSelfieSegmentationTfjsModelConfig {
        modelType?: 'general' | 'landscape';
        runtime: 'tfjs';
    }

    export interface BodySegmenter {
        dispose(): void;
        reset(): void;
        segmentPeople(input: unknown, segmentationConfig?: unknown): Promise<Array<{
            mask: {
                toImageData(): Promise<ImageData>;
            };
        }>>;
    }

    export function createSegmenter(
        model: SupportedModels,
        modelConfig?: MediaPipeSelfieSegmentationTfjsModelConfig | Record<string, unknown>
    ): Promise<BodySegmenter>;
}

declare module 'react-native-paper';
