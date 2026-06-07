import { showLightnessThreshold } from "./pixel-sorting";

// Worker message handler
self.onmessage = (
	event: MessageEvent<{ imageData: ImageData; threshold: number }>,
) => {
	const { imageData, threshold } = event.data;
	const result = showLightnessThreshold(imageData, threshold);
	self.postMessage(result, { transfer: [result.data.buffer] });
};
