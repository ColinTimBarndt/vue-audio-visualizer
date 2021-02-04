enum WindowFunctionType {
	/**
	 * A basic half cosine curve with its maximum in the middle.
	 */
	Hanning = "Hanning",
	/**
	 * Like `Hanning`, but with some scaling applied.
	 */
	Hamming = "Hamming",
	/**
	 * Similar to the `Hamming` window, but the width of the main
	 * lobe is 50% wider.
	 */
	Blackman = "Blackman",
	/**
	 * Similar to `Blackman`.
	 */
	BlackmanHarris = "Blackman Harris",
	/**
	 * A linear abs-function. The ends are non-zero.
	 */
	Parzen = "Parzen",
	/**
	 * Like `Parzen`, but squared (`1 - (etc * etc)`).
	 */
	Welch = "Welch",
}
export default WindowFunctionType;

const { PI, cos, abs } = Math;
const PI2 = 2 * PI;

/**
 * @deprecated This has been implemented in WebAssembly
 *
 * Sources:
 * - [dsp-kit](https://github.com/oramics/dsp-kit/blob/master/packages/window/index.js) (package `window`)
 * - https://www.noobdoaaa.com/read=12
 */
export const windowFunctions: {
	[key in WindowFunctionType]: (
		n: number,
		opt?: number
	) => Generator<number, void>;
} = {
	*Hanning(n) {
		const nn = PI2 / (n - 1);
		for (var i = 0; i < n; i++) yield 0.5 * (1 - cos(i * nn));
	},
	*Hamming(n) {
		const nn = PI2 / (n - 1);
		for (var i = 0; i < n; i++) yield 0.54 - 0.46 * cos(i * nn);
	},
	*Blackman(n, a = 0.16) {
		const nn = PI2 / (n - 1);
		const ha = 0.5 * a;
		const af = 0.5 - ha;
		for (var i = 0, z; i < n; i++) {
			z = i * nn;
			yield af - 0.5 * cos(z) + ha * cos(2 * z);
		}
	},
	*["Blackman Harris"](n) {
		const nn = PI2 / (n - 1);
		for (var i = 0, z; i < n; i++) {
			z = i * nn;
			yield 0.35875 -
				0.48829 * cos(z) +
				0.14128 * cos(2 * z) -
				0.01168 * cos(3 * z);
		}
	},
	*Parzen(n) {
		const hn = 0.5 * n;
		// 0.5 * (n - 1)
		const hm = hn - 0.5;
		// 1 / (0.5 * (n + 1))
		const s = 1 / (hn + 0.5);
		for (var i = 0; i < n; i++) yield 1 - abs((i - hm) * s);
	},
	*Welch(n) {
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
