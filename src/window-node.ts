export enum WindowFunctionType {
	/**
	 * A basic half cosine curve with its maximum in the middle.
	 */
	Hanning = "hanning",
	/**
	 * Like `Hanning`, but with some scaling applied.
	 */
	Hamming = "hamming",
	/**
	 * Similar to the `Hamming` window, but the width of the main
	 * lobe is 50% wider.
	 */
	Blackman = "blackman",
	/**
	 * Similar to `Blackman`.
	 */
	BlackmanHarris = "blackmanharris",
	/**
	 * A linear abs-function. The ends are non-zero.
	 */
	Parzen = "parzen",
	/**
	 * Like `Parzen`, but squared (`1 - (etc * etc)`).
	 */
	Welch = "welch",
}

export default class WindowNode extends AudioWorkletNode {
	#windowFunction: WindowFunctionType|null = WindowFunctionType.BlackmanHarris;

	constructor(ctx: BaseAudioContext) {
		super(ctx, "window", {
			numberOfInputs: 1,
			numberOfOutputs: 1,
		});
	}

	get windowFunction() {
		return this.#windowFunction;
	}
	set windowFunction(f) {
		this.port.postMessage({ windowFunction: f });
		this.#windowFunction = f;
	}
}