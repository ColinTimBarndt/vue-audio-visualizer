/*
 * This code runs in an Audio Worklet Scope, detached from
 * the window.
 */

/*
import WindowFunctionType from "./window-function";
// @ts-ignore
import * as WasmFFT from "../pkg/wasm_fft";

class WindowProcessor extends AudioWorkletProcessor {
	public windowFunction: WindowFunctionType | null = null; // WindowFunctionType.BlackmanHarris;

	constructor(options?: AudioWorkletNodeOptions) {
		super(options);

		this.port.addEventListener(
			"message",
			(
				event: MessageEvent<{
					windowFunction?: WindowFunctionType | null;
					wasm?: Uint8Array;
				}>
			) => {
				const { data } = event;
				if (data.windowFunction) {
					this.windowFunction = data.windowFunction;
				}
				if (data.wasm) {
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
		}
		return false;
	}

	static get parameterDescriptors() {
		return [];
	}
}

registerProcessor("window", WindowProcessor);
export default WindowProcessor;
*/
