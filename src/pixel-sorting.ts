type Pixel = [number, number, number, number];

export interface SortingImage {
	pixels: Uint8ClampedArray;
	width: number;
	// Between 0 and 255
	lightness: Uint8ClampedArray | null;
	thresholdMap: boolean[] | null;
}

export interface ThresholdOptions {
	type: "lightness";
	min: number;
	max: number;
}

export const imageDataToSortingImage = (imageData: ImageData): SortingImage => {
	return {
		pixels: imageData.data,
		width: imageData.width,
		lightness: null,
		thresholdMap: null,
	};
};

export const toRegionsImageData = (image: SortingImage): ImageData => {
	if (image.thresholdMap === null) throw Error("Threshold map not computed");

	const thresholdMap = image.thresholdMap;

	const newPixels = new Uint8ClampedArray(image.pixels.length);
	const nbrPixels = thresholdMap.length;

	for (let i = 0; i < nbrPixels; i++) {
		const val = thresholdMap[i] ? 0 : 255;

		newPixels[i * 4] = val;
		newPixels[i * 4 + 1] = val;
		newPixels[i * 4 + 2] = val;
		newPixels[i * 4 + 3] = 255;
	}

	const newImageData = new ImageData(newPixels, image.width);
	return newImageData;
};

const computeLightness = (image: SortingImage) => {
	// Skip if already computed
	if (image.lightness !== null) return;

	const pixels = image.pixels;
	const nbrPixels = image.pixels.length / 4;
	image.lightness = new Uint8ClampedArray(nbrPixels);

	for (let i = 0; i < nbrPixels; i++) {
		// Normalize
		const rNorm = pixels[i * 4];
		const gNorm = pixels[i * 4 + 1];
		const bNorm = pixels[i * 4 + 2];

		// Find max and min
		const maxVal = Math.max(rNorm, gNorm, bNorm);
		const minVal = Math.min(rNorm, gNorm, bNorm);

		// Lightness
		const l = (maxVal + minVal) / 2;

		image.lightness[i] = l;
	}
};

export const computeThresholds = (
	image: SortingImage,
	options: ThresholdOptions,
) => {
	if (options.type === "lightness") {
		// Need lightness
		computeLightness(image);

		if (image.lightness === null) throw Error("No lightness computed");

		// Check thresholds
		const lightness = image.lightness;
		image.thresholdMap = new Array(lightness.length);

		for (let i = 0; i < image.lightness.length; i++) {
			const l = lightness[i];

			image.thresholdMap[i] = l >= options.min && l <= options.max;
		}
	} else {
		throw Error("Unknown threshold option type");
	}
};

// const rgbaToHsl = (pixel: Pixel): [number, number, number] => {
// 	// Normalize
// 	const rNorm = pixel[0] / 255;
// 	const gNorm = pixel[1] / 255;
// 	const bNorm = pixel[2] / 255;

// 	// Find max and min
// 	const maxVal = Math.max(rNorm, gNorm, bNorm);
// 	const minVal = Math.min(rNorm, gNorm, bNorm);
// 	const delta = maxVal - minVal;

// 	// Lightness
// 	const l = (maxVal + minVal) / 2;

// 	// Saturation
// 	const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

// 	// Hue
// 	let h = 0;

// 	if (delta === 0) {
// 		h = 0;
// 	} else if (maxVal === rNorm) {
// 		h = 60 * (((gNorm - bNorm) / delta) % 6);
// 	} else if (maxVal === gNorm) {
// 		h = 60 * ((bNorm - rNorm) / delta + 2);
// 	} else if (maxVal === bNorm) {
// 		h = 60 * ((rNorm - gNorm) / delta + 4);
// 	}

// 	return [h, s, l];
// };

