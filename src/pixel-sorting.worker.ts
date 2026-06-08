import {
	computeThresholds,
	imageDataToSortingImage,
	toRegionsImageData,
} from "./pixel-sorting";

// Worker message handler
self.onmessage = (
	event: MessageEvent<{ imageData: ImageData; minT: number; maxT: number }>,
) => {
	const { imageData, minT, maxT } = event.data;

	const image = imageDataToSortingImage(imageData);
	computeThresholds(image, { type: "lightness", min: minT, max: maxT });
	const result = toRegionsImageData(image);

	self.postMessage(result, { transfer: [result.data.buffer] });
};
