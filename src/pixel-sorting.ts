type Pixel = [number, number, number, number];

const unflattenPixels = (pixels: ImageDataArray): Pixel[] => {
	// Groups of 4
	const res: Pixel[] = Array(pixels.length / 4);

	for (let i = 0; i < res.length; i++) {
		const index = i * 4;
		res[i] = [
			pixels[index],
			pixels[index + 1],
			pixels[index + 2],
			pixels[index + 3],
		];
	}

	return res;
};

const flattenPixels = (pixels: Pixel[]): ImageDataArray => {
	const res = new Uint8ClampedArray(pixels.length * 4);

	for (let i = 0; i < pixels.length; i++) {
		const index = i * 4;
		res[index] = pixels[i][0];
		res[index + 1] = pixels[i][1];
		res[index + 2] = pixels[i][2];
		res[index + 3] = pixels[i][3];
	}

	return res;
};

const rgbaToHsl = (pixel: Pixel): [number, number, number] => {
	// Normalize
	const rNorm = pixel[0] / 255;
	const gNorm = pixel[1] / 255;
	const bNorm = pixel[2] / 255;

	// Find max and min
	const maxVal = Math.max(rNorm, gNorm, bNorm);
	const minVal = Math.min(rNorm, gNorm, bNorm);
	const delta = maxVal - minVal;

	// Lightness
	const l = (maxVal + minVal) / 2;

	// Saturation
	const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

	// Hue
	let h = 0;

	if (delta === 0) {
		h = 0;
	} else if (maxVal === rNorm) {
		h = 60 * (((gNorm - bNorm) / delta) % 6);
	} else if (maxVal === gNorm) {
		h = 60 * ((bNorm - rNorm) / delta + 2);
	} else if (maxVal === bNorm) {
		h = 60 * ((rNorm - gNorm) / delta + 4);
	}

	return [h, s, l];
};

const getLightnessThresholdMap = (
	imageData: ImageData,
	threshold: number,
): boolean[] => {
	const flatPixels = imageData.data;
	console.log(flatPixels);

	// Get unflattened
	const pixels = unflattenPixels(flatPixels);
	const hitTreshold = Array<boolean>(pixels.length);

	// Go through each pixel
	for (let i = 0; i < pixels.length; i++) {
		const pixel = pixels[i];

		// Check condition
		const hsl = rgbaToHsl(pixel);
		const l = hsl[2];

		hitTreshold[i] = l >= threshold;
	}

	return hitTreshold;
};

export const showLightnessThreshold = (
	imageData: ImageData,
	threshold: number,
): ImageData => {
	const hitTreshold = getLightnessThresholdMap(imageData, threshold);

	// Create new image
	const newPixels = Array<Pixel>(hitTreshold.length);

	for (let i = 0; i < hitTreshold.length; i++) {
		newPixels[i] = hitTreshold[i] ? [255, 255, 255, 255] : [0, 0, 0, 0];
	}

	const newFlattenedPixels = flattenPixels(newPixels);
	const newImageData = new ImageData(newFlattenedPixels, imageData.width);

	return newImageData;
};
