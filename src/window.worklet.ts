/*
 * This code runs in an Audio Worklet Scope, detached from
 * the window.
 */

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

const { PI, cos, abs } = Math;
const PI2 = 2 * PI;

const buffers: { [key: string]: Float32Array } = {};

/**
 * TODO: Optimize with WebAssembly
 *
 * Sources:
 * - https://github.com/oramics/dsp-kit (package `window`)
 * - https://www.noobdoaaa.com/read=12
 */
const windowFunctions: {
	[key in WindowFunctionType]: (
		n: number,
		opt?: number
	) => Generator<number, void>;
} = {
	*hanning(n) {
		for (var i = 0; i < n; i++) yield 0.5 * (1 - cos((PI2 * i) / (n - 1)));
	},
	*hamming(n) {
		for (var i = 0; i < n; i++)
			yield 0.54 - 0.46 * cos(1 - cos((PI2 * i) / (n - 1)));
	},
	*blackman(n, a = 0.16) {
		const nn = PI2 / (n - 1);
		const ha = 0.5 * a;
		const af = 0.5 - ha;
		for (var i = 0, z; i < n; i++) {
			z = i * nn;
			yield af - 0.5 * cos(z) + ha * cos(2 * z);
		}
	},
	*blackmanharris(n) {
		const nn = PI2 / (n - 1);
		for (var i = 0, z; i < n; i++) {
			z = i * nn;
			yield 0.35875 -
				0.48829 * cos(z) +
				0.14128 * cos(2 * z) -
				0.01168 * cos(3 * z);
		}
	},
	*parzen(n) {
		const hn = 0.5 * n;
		// 0.5 * (n - 1)
		const hm = hn - 0.5;
		const s = 1 / (hn + 0.5);
		for (var i = 0; i < n; i++) yield 1 - abs((i - hm) * s);
	},
	*welch(n) {
		const hn = 0.5 * n;
		// 0.5 * (n - 1)
		const hm = hn - 0.5;
		// 0.5 * (n + 1)
		const hp = hn + 0.5;
		// [ 1 / (0.5 * (n + 1)) ]²
		const sq = 1 / (hp * hp);
		for (var i = 0; i < n; i++) {
			const a = i - hm;
			yield 1 - a * a * sq;
		}
	},
};

class WindowProcessor extends AudioWorkletProcessor {
	public windowFunction: WindowFunctionType | null = null; // WindowFunctionType.BlackmanHarris;

	constructor(options?: AudioWorkletNodeOptions) {
		super(options);

		this.port.addEventListener(
			"message",
			({
				data,
			}: MessageEvent<{ windowFunction?: WindowFunctionType | null }>) => {
				if (data.windowFunction) {
					this.windowFunction = data.windowFunction;
				}
			}
		);
	}

	process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
		if (inputs[0]?.length && outputs[0]?.length) {
			const [[i]] = inputs;
			const [[o]] = outputs;
			if (this.windowFunction === null) {
				o.set(i);
				return false;
			}
			const mod = getBuffer(this.windowFunction, i.length);
			i.forEach((sample, idx) => void (o[idx] = sample * mod[idx]));
		}
		return false;
	}

	static get parameterDescriptors() {
		return [];
	}
}

function getBuffer(f: WindowFunctionType, n: number): Float32Array {
	const key = `${f}#${n}`;
	if (key in buffers) return buffers[key];
	else return (buffers[key] = new Float32Array(windowFunctions[f](n)));
}

registerProcessor("window", WindowProcessor);
