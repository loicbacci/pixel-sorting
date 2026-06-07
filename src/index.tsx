import { render, type TargetedEvent } from "preact";

import { useState } from "preact/hooks";
import "./style.css";

export function App() {
	const [imageData, setImageData] = useState<ImageData | null>(null);
	const [imageURL, setImageURL] = useState<string | null>(null);
	const [imageCanvas, setImageCanvas] = useState<OffscreenCanvas | null>(null);

	const [baseImageURL, setBaseImageURL] = useState<string | null>(null);
	const [regionsImageURL, setRegionsImageURL] = useState<string | null>(null);

	const [isComputing, setIsComputing] = useState<boolean>(false);

	const [lThreshold, setLThreshold] = useState(0.5);

	const createImageData = async (imageBuffer: ArrayBuffer) => {
		// Create blob
		const blob = new Blob([imageBuffer]);

		// Create image bitmap
		const imageBitmap = await createImageBitmap(blob);

		// Create canvas
		const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
		setImageCanvas(canvas);
		const canvasCtx = canvas.getContext("2d");

		if (canvasCtx === null) {
			console.error("Error creating canvas context");
			return;
		}

		// Get image data
		canvasCtx.drawImage(imageBitmap, 0, 0);
		const newImageData = canvasCtx.getImageData(
			0,
			0,
			imageBitmap.width,
			imageBitmap.height,
		);

		setImageData(newImageData);
	};

	const handleFileChange = (e: TargetedEvent<HTMLInputElement, Event>) => {
		if (e.currentTarget?.files) {
			const file = e.currentTarget.files[0];
			const url = URL.createObjectURL(file);
			setImageURL(url);
			setBaseImageURL(url);

			const reader = new FileReader();
			reader.onload = () => createImageData(reader.result as ArrayBuffer);
			reader.readAsArrayBuffer(file);
		}
	};

	const showNewImageData = async (newImageData: ImageData) => {
		if (imageCanvas === null) return;

		const ctx = imageCanvas.getContext("2d");

		if (ctx === null) return;

		ctx.putImageData(newImageData, 0, 0);
		const outputBlob = await imageCanvas.convertToBlob();
		const url = URL.createObjectURL(outputBlob);

		setImageURL(url);
		setRegionsImageURL(url);
	};

	const handleComputeRegions = async () => {
		if (imageData === null) return;

		setIsComputing(true);

		// Create worker to compute regions
		const worker = new Worker(
			new URL("./pixel-sorting.worker.ts", import.meta.url),
			{ type: "module" },
		);

		worker.onmessage = (e: MessageEvent<ImageData>) => {
			showNewImageData(e.data);
			worker.terminate();
			setIsComputing(false);
		};

		worker.onerror = () => {
			worker.terminate();
			setIsComputing(false);
		};

		worker.postMessage({ imageData, threshold: lThreshold });
	};

	return (
		<div className="flex flex-col gap-4 w-full min-h-screen py-5 px-6">
			<header>
				<h1 className="text-3xl font-bold">Pixel Sorting</h1>
			</header>

			<main className="flex flex-row gap-2">
				<section className="border p-3 w-sm flex flex-col">
					<h2 className="text-lg font-bold">Controls</h2>

					<div className="flex flex-col gap-2 pt-4">
						<label className="font-semibold" for="image-picker">
							Pick an image
						</label>
						<input
							type="file"
							accept="image/*"
							className="file-input file-input-sm file-input-primary"
							onChange={handleFileChange}
							name="image-picker"
						/>
					</div>

					{/* COMPUTE REGIONS */}
					{imageData && (
						<>
							<div class="divider"></div>
							<button
								type="button"
								className="btn btn-sm"
								onClick={handleComputeRegions}
								disabled={isComputing}
							>
								{isComputing ? (
									<>
										<span className="loading loading-spinner"></span>Loading
									</>
								) : regionsImageURL ? (
									"Re-compute regions"
								) : (
									"Compute regions"
								)}
							</button>
						</>
					)}

					{baseImageURL && (
						<>
							<div class="divider"></div>

							<div className="flex flex-col gap-3">
								<h3 className="font-semibold">Regions controls</h3>

								{/* THRESHOLD */}
								<div className="flex flex-col gap-2">
									<label for="lightness-threshold" className="text-sm">
										Lightness threshold
									</label>

									<div className="flex flex-row gap-2 items-center">
										<input
											type="range"
											min="0"
											max="100"
											className="range range-primary range-sm w-full"
											name="lightness-threshold"
											value={lThreshold * 100}
											onChange={(e) => setLThreshold(e.target.value / 100.0)}
										/>
										<p className="w-10">{lThreshold}</p>
									</div>
								</div>
							</div>
						</>
					)}

					{/* IMAGE SELECTION */}
					{baseImageURL && (
						<>
							<div class="divider"></div>
							<div className="flex flex-col gap-3">
								<h3 className="font-semibold">Choose image</h3>

								{baseImageURL && (
									<div className="flex flex-row gap-2 items-center">
										<input
											type="radio"
											className="radio radio-sm"
											name="original-image"
											checked={imageURL === baseImageURL}
											onChange={() => setImageURL(baseImageURL)}
										/>
										<label for="original-image" className="text-sm">
											Original
										</label>
									</div>
								)}

								{regionsImageURL && (
									<div className="flex flex-row gap-2 items-center">
										<input
											type="radio"
											className="radio radio-sm"
											name="regions-image"
											checked={imageURL === regionsImageURL}
											onChange={() => setImageURL(regionsImageURL)}
										/>
										<label for="regions-image" className="text-sm">
											Regions
										</label>
									</div>
								)}
							</div>
						</>
					)}
				</section>

				<section className="border p-2 w-full">
					{imageURL && <img alt="User uploaded" src={imageURL} />}
				</section>
			</main>
		</div>
	);
}

// @ts-expect-error
render(<App />, document.getElementById("app"));
