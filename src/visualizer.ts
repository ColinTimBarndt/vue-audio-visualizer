import PanelVisualizer from "./components/PanelVisualizer.vue";
import PanelSelectVisualizer from "./components/PanelSelectVisualizer.vue";
import IPanel from "@/panel-type";
import { DeepReadonly } from "vue";
import uid from "./uid";

// https://github.com/BIDS/colormap/blob/master/colormaps.py
let magmaColormap: null | Uint8ClampedArray = null;
import("./assets/colormaps/magma.json").then(({ default: cmap }) => {
	magmaColormap = new Uint8ClampedArray(cmap.map(Math.round));
});

function hertzToIndex(hz: number, bufferLength: number, sampleRate: number) {
	return (hz * 2 * bufferLength) / sampleRate;
}

function indexToHertz(idx: number, bufferLength: number, sampleRate: number) {
	return (idx * sampleRate) / (2 * bufferLength);
}

export class VisualizerSelectPanel implements IPanel {
	readonly title = "New Visualizer";
	readonly component = PanelSelectVisualizer.name;
	readonly componentAttributes: {
		options: any[];
		callback?: (v: typeof Object) => void;
	} = {
		options: [
			VisualizerFrequencyGraph,
			VisualizerAudioGraph,
			Visualizer80sBarGraph,
			VisualizerSpectogram,
		],
	};
	readonly componentPersistent = false;
	readonly uid = uid();

	constructor(callback: (v: typeof Object) => void) {
		this.componentAttributes.callback = callback;
	}
}

export abstract class Visualizer implements IPanel {
	readonly component = PanelVisualizer.name;
	readonly componentAttributes = { visualizer: this };
	readonly componentPersistent = false;
	readonly uid = uid();

	static readonly visualizerName: string = "Visualizer";

	protected matrix: DOMMatrix = new DOMMatrix([1, 0, 0, 1, 0, 0]);
	public readonly canvasOptions: {
		[key in "canvas" | "labels"]: CanvasRenderingContext2DSettings;
	} = {
		canvas: {},
		labels: {},
	};

	protected style = {
		background: "white",
		foreground: "black",
		middleground: "lightgray",
		color: "darkgreen",
		fontText: "sans-serif",
		fontButtons: "sans-serif",
		fontHeaders: "sans-serif",
	};

	constructor(
		public readonly title: string,
		protected readonly audioInput: AnalyserNode,
		protected readonly audioData: DeepReadonly<{
			frequency: Uint8Array;
			timeDomain: Uint8Array;
		}>,
		protected readonly audioContext: AudioContext
	) {
		this.setup();
	}

	/**
	 * Called at the end of the Visualizer constructor.
	 * This is for convenience.
	 */
	setup(): void {}

	abstract render(ctx: CanvasRenderingContext2D): void;

	/**
	 * Draws labels on top of the rendered canvas.
	 * This method is only called if labeling is
	 * turned on in the settings.
	 * @param ctx
	 */
	drawLabels(ctx: CanvasRenderingContext2D): void {}

	init(
		ctx: CanvasRenderingContext2D,
		width: number = 720,
		height?: number
	): void {
		// Loads the theme colors from CSS
		if ("getComputedStyle" in window) {
			const computed = window.getComputedStyle(ctx.canvas);
			for (const prop of Object.keys(this.style)) {
				const v = computed.getPropertyValue("--canvas-" + prop);
				if (v) (this.style as { [idx: string]: string })[prop] = v;
			}
		}
		// Set canvas size
		ctx.canvas.width = width;
		ctx.canvas.height = height ?? Math.round((width * 9) / 16);

		// Chrome needs a user interaction for Audio to work.
		this.audioContext.resume();
	}

	initLabels(
		ctx: CanvasRenderingContext2D,
		width: number = 720,
		height?: number
	): void {
		// Set canvas size
		ctx.canvas.width = width;
		ctx.canvas.height = height ?? Math.round((width * 9) / 16);
	}

	clearCanvas(ctx: CanvasRenderingContext2D) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	contextProxy(ctx: CanvasRenderingContext2D) {
		return {
			beginPath: ctx.beginPath.bind(ctx),
			stroke: ctx.stroke.bind(ctx),
			lineTo: (x: number, y: number) =>
				t(
					this.matrix,
					x,
					y,
					CanvasRenderingContext2D.prototype.lineTo.bind(ctx)
				),
			moveTo: (x: number, y: number) =>
				t(
					this.matrix,
					x,
					y,
					CanvasRenderingContext2D.prototype.moveTo.bind(ctx)
				),
			fillText: (
				text: string,
				x: number,
				y: number,
				maxWidth?: number,
				ox: number = 0,
				oy: number = 0
			) =>
				t(this.matrix, x, y, (x, y) =>
					ctx.fillText(text, x + ox, y + oy, maxWidth)
				),
			strokeText: (
				text: string,
				x: number,
				y: number,
				maxWidth?: number,
				ox: number = 0,
				oy: number = 0
			) =>
				t(this.matrix, x, y, (x, y) =>
					ctx.strokeText(text, x + ox, y + oy, maxWidth)
				),
		};

		function t(
			matrix: DOMMatrix,
			x: number,
			y: number,
			f: (x: number, y: number) => void
		) {
			const { x: x1, y: y1 } = matrix.transformPoint({ x, y });
			f(x1, y1);
		}
	}
}

export class VisualizerPlaceholder extends Visualizer {
	static readonly visualizerName: string = "Placeholder";

	init(ctx: CanvasRenderingContext2D) {
		super.init(ctx);

		ctx.font = "80px " + this.style.fontHeaders;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = this.style.color;
	}
	render(ctx: CanvasRenderingContext2D) {
		this.clearCanvas(ctx);
		ctx.fillText(
			"I am a canvas",
			ctx.canvas.width / 2,
			ctx.canvas.height / 2,
			ctx.canvas.width
		);
	}
}

export class VisualizerFrequencyGraph extends Visualizer {
	static readonly visualizerName: string = "Frequency Graph";

	visLen = Math.floor(this.audioData.frequency.length / 2);

	init(ctx: CanvasRenderingContext2D) {
		super.init(ctx);

		const widthMod = ctx.canvas.width / this.visLen;
		const heightMod = ctx.canvas.height / 256;
		this.matrix = new DOMMatrix([
			0,
			-heightMod,
			widthMod,
			0,
			0,
			ctx.canvas.height,
		]);
		ctx.lineJoin = "round";
		ctx.lineWidth = 2;
		ctx.strokeStyle = this.style.color;
	}

	render(ctx: CanvasRenderingContext2D) {
		this.clearCanvas(ctx);

		const pctx = this.contextProxy(ctx);

		pctx.beginPath();
		pctx.moveTo(this.audioData.frequency[0], 0);
		for (var idx = 2; idx < this.visLen; idx += 2) {
			pctx.lineTo(this.audioData.frequency[idx], idx);
		}
		pctx.stroke();
	}

	initLabels(ctx: CanvasRenderingContext2D) {
		super.initLabels(ctx);

		ctx.fillStyle = this.style.foreground;
		ctx.font = "20px " + this.style.fontText;
		ctx.textBaseline = "hanging";
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.2;
		ctx.strokeStyle = this.style.foreground;

		// Draw
		const { visLen } = this;
		const { sampleRate } = this.audioContext;

		const pctx = this.contextProxy(ctx);
		const maxFq = indexToHertz(visLen, visLen, sampleRate);
		ctx.textAlign = "start";

		pctx.beginPath();
		for (var i = 2000; i < maxFq; i += 2000) labelFrequency(i);

		pctx.moveTo(127, 0);
		pctx.lineTo(127, visLen);
		ctx.textAlign = "end";
		pctx.fillText(
			`${(this.audioInput.maxDecibels - this.audioInput.minDecibels) / 2}db`,
			127,
			visLen,
			undefined,
			-2,
			4
		);
		pctx.stroke();

		function labelFrequency(hz: number, l: boolean = true) {
			const x = hertzToIndex(hz, visLen, sampleRate);
			pctx.moveTo(255, x);
			pctx.lineTo(0, x);
			if (l) {
				const text = hz >= 1000 ? `${hz / 1000}k` : hz + "";
				pctx.fillText(text, 255, x, undefined, 2, 4);
			}
		}
	}

	drawLabels(_ctx: CanvasRenderingContext2D) {
		// Only drawn once on initialisation
	}
}

export class VisualizerAudioGraph extends Visualizer {
	static readonly visualizerName: string = "Audio Graph";

	init(ctx: CanvasRenderingContext2D) {
		super.init(ctx);

		ctx.strokeStyle = this.style.color;
		ctx.lineWidth = 2;
		ctx.lineJoin = "round";

		const heightMod = ctx.canvas.height / 256;
		this.matrix = new DOMMatrix([0, -heightMod, 0, 0, 0, ctx.canvas.height]);
	}

	updateMatrix(
		ctx: CanvasRenderingContext2D,
		startX: number = 0,
		widthP: number = 1
	) {
		const widthMod =
			ctx.canvas.width / (widthP * this.audioData.timeDomain.length - startX);
		this.matrix.c = widthMod;
		this.matrix.e = -startX * widthMod;
	}

	render(ctx: CanvasRenderingContext2D) {
		this.clearCanvas(ctx);

		const [highestFreqAmp, highestFreqIndex] = this.audioData.frequency.reduce<
			any // [number, number], TypeScript has an error parsing it with specific type arguments
		>(([amp1, fx1], amp2, fx2) => (amp1 > amp2 ? [amp1, fx1] : [amp2, fx2]), [
			0,
			0,
		]);

		// Calculate Hertz frequency as described in the documentation
		const highestFreqHz = indexToHertz(
			highestFreqIndex,
			this.audioData.frequency.length,
			this.audioContext.sampleRate
		);

		// Inverval length
		const iv = highestFreqAmp > 50 ? 1 / highestFreqHz : 0;

		const startIndex = Math.round(iv * this.audioContext.sampleRate);

		const offsetX =
			highestFreqAmp > 50
				? Math.round(
						(this.audioContext.currentTime % iv) * this.audioContext.sampleRate
				  ) % this.audioData.timeDomain.length
				: 0;

		const startX = startIndex - offsetX;

		this.updateMatrix(ctx, startX, 0.25);

		const pctx = this.contextProxy(ctx);

		pctx.beginPath();
		pctx.moveTo(this.audioData.timeDomain[startX], startX);
		var x: number;
		// Only look at a quarter of the data
		var endX: number = this.audioData.timeDomain.length / 4;

		for (x = startX; x < endX; x += 2)
			pctx.lineTo(this.audioData.timeDomain[x], x);
		pctx.stroke();
	}
}

export class Visualizer80sBarGraph extends Visualizer {
	static readonly visualizerName: string = "80s Bar Graph";

	barCount = 16;
	verticalLines = 20;
	lineWidth = 5;
	barWidth = 25;
	maxHz = 2800;

	// Needs to be initialized
	maxFreqIdx = NaN;
	quantisationIndex: number[] = [];
	maximumVolumes: number[] = [];

	// Local
	lastTime: number = this.audioContext.currentTime;

	init(ctx: CanvasRenderingContext2D) {
		super.init(ctx);

		ctx.lineWidth = this.lineWidth;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";

		// Convert Hz to the frequency buffer index (with decimal component)
		this.maxFreqIdx = hertzToIndex(
			this.maxHz,
			this.audioData.frequency.length,
			this.audioContext.sampleRate
		);
		// Logarithmic scale
		this.quantisationIndex = new Array<number>(this.barCount);
		for (let i = this.barCount - 1, j = this.maxFreqIdx; i >= 0; i--) {
			this.quantisationIndex[i] = Math.floor(j);
			j *= 0.82;
		}
		this.maximumVolumes = new Array<number>(this.barCount).fill(0);

		const widthMod = ctx.canvas.width / this.barCount;
		const heightMod = ctx.canvas.height / this.verticalLines;
		this.matrix = new DOMMatrix([
			widthMod,
			0,
			0,
			-heightMod,
			this.barWidth,
			ctx.canvas.height - heightMod * 0.5,
		]);
	}

	render(ctx: CanvasRenderingContext2D) {
		this.clearCanvas(ctx);

		const hBarWidth = this.barWidth * 0.5;
		const barScale = this.verticalLines / 255;

		ctx.beginPath();

		const volumes = new Array<number>(this.barCount);
		var i,
			j = 0,
			q,
			qi,
			pqi = -1;
		for (i = 0; i < this.barCount; i++) {
			q = 0;
			qi = this.quantisationIndex[i];
			for (; j < qi; j++) q += this.audioData.frequency[j];
			q /= qi - pqi;
			pqi = qi;
			drawBar(this.matrix, i, (q = Math.floor(q * barScale)));
			volumes[i] = q;
			if (q > this.maximumVolumes[i]) this.maximumVolumes[i] = q;
		}
		ctx.strokeStyle = this.style.color;
		ctx.stroke();

		const dt = this.audioContext.currentTime - this.lastTime;
		this.lastTime = this.audioContext.currentTime;

		ctx.beginPath();
		for (i = 0; i < this.barCount; i++) {
			const max = this.maximumVolumes[i];
			drawMaxLine(this.matrix, i, max);
			this.maximumVolumes[i] = max - 3 * dt;
		}
		ctx.strokeStyle = this.style.foreground;
		ctx.stroke();

		function drawBar(matrix: DOMMatrix, x: number, lines: number) {
			var y: number;
			for (y = 0; y < lines; y++) {
				const { x: px, y: py } = matrix.transformPoint({ x, y });
				ctx.moveTo(px - hBarWidth, py);
				ctx.lineTo(px + hBarWidth, py);
			}
		}
		function drawMaxLine(matrix: DOMMatrix, x: number, max: number) {
			const { x: px, y: py } = matrix.transformPoint({ x, y: max });
			ctx.moveTo(px - hBarWidth, py);
			ctx.lineTo(px + hBarWidth, py);
		}
	}
}

export class VisualizerSpectogram extends Visualizer {
	static readonly visualizerName: string = "Spectogram";

	visLen = Math.floor(this.audioData.frequency.length / 2);
	yScale = NaN;
	sliceCanvas = document.createElement("canvas");
	sliceCtx = this.sliceCanvas.getContext("2d", { alpha: false })!;
	imgdata = new ImageData(1, this.visLen);

	strictAnalyzer: AnalyserNode = this.audioContext.createAnalyser();
	buffer!: Uint8Array;
	// Delta seconds as a circular buffer
	dts!: Float32Array;
	dtsi: number = 0;
	lastTime: number = this.audioContext.currentTime;

	setup() {
		this.canvasOptions.canvas.alpha = false;
	}

	init(ctx: CanvasRenderingContext2D) {
		super.init(ctx);

		this.yScale = ctx.canvas.height / this.visLen;
		this.sliceCanvas.width = 1;
		this.sliceCanvas.height = this.visLen;

		this.strictAnalyzer.fftSize = this.audioInput.fftSize / 2;
		this.strictAnalyzer.minDecibels = this.audioInput.minDecibels;
		this.strictAnalyzer.maxDecibels = this.audioInput.maxDecibels;
		this.strictAnalyzer.smoothingTimeConstant = 0;
		this.audioInput.connect(this.strictAnalyzer);
		this.buffer = new Uint8Array(this.strictAnalyzer.frequencyBinCount);

		this.dts = new Float32Array(ctx.canvas.width).fill(-1);

		// Set Opaque
		for (var i = 0; i < this.visLen; i++) this.imgdata.data[i * 4 + 3] = 255;

		ctx.imageSmoothingQuality = "low";
	}

	render(ctx: CanvasRenderingContext2D) {
		if (magmaColormap) {
			this.strictAnalyzer.getByteFrequencyData(this.buffer);
			for (var idx = 0, byte, off, cOff; idx < this.visLen; idx++) {
				byte = this.buffer[idx];
				off = idx * 4;
				cOff = byte * 3;
				this.imgdata.data[off] = magmaColormap![cOff];
				this.imgdata.data[off + 1] = magmaColormap![cOff + 1];
				this.imgdata.data[off + 2] = magmaColormap![cOff + 2];
			}
			this.sliceCtx.putImageData(this.imgdata, 0, 0);
			// Move cache to the left by one
			ctx.resetTransform();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(
				ctx.canvas,
				1,
				0,
				ctx.canvas.width - 1,
				ctx.canvas.height,
				0,
				0,
				ctx.canvas.width - 1,
				ctx.canvas.height
			);
			// Draw new slice on the left
			ctx.setTransform(
				1,
				0,
				0,
				-this.yScale,
				ctx.canvas.width - 1,
				ctx.canvas.height
			);
			ctx.imageSmoothingEnabled = true;
			ctx.drawImage(this.sliceCanvas, 0, 0);

			// Measure time (push dt into circular buffer)
			const dt = this.audioContext.currentTime - this.lastTime;
			this.lastTime = this.audioContext.currentTime;
			this.dts[this.dtsi++] = dt;
			this.dtsi %= this.dts.length;
		}
	}

	initLabels(ctx: CanvasRenderingContext2D) {
		super.initLabels(ctx);

		ctx.strokeStyle = "white";
		ctx.fillStyle = "white";
		ctx.font = "20px " + this.style.fontText;
		ctx.textAlign = "start";
		ctx.textBaseline = "hanging";
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.1;
	}

	drawLabels(ctx: CanvasRenderingContext2D) {
		this.clearCanvas(ctx);

		const {
			visLen,
			audioContext: { sampleRate },
			audioData: { frequency },
		} = this;
		const { width, height } = ctx.canvas;

		ctx.beginPath();
		for (var i = 0, t = 0, tt = 0, dt; i < width; i++) {
			dt = this.dts[(this.dts.length + this.dtsi - 1 - i) % this.dts.length];
			if (dt < 0) break;
			if (t > 2) {
				t -= 2;
				labelTime(width - i, tt);
			}
			t += dt;
			tt += dt;
		}

		const maxFq = indexToHertz(visLen, visLen, sampleRate);

		for (var i = 2000; i < maxFq; i += 2000) {
			labelFrequency(i);
		}

		ctx.stroke();

		function labelTime(x: number, time: number, l: boolean = true) {
			x = Math.round(x);
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			if (l) {
				const text = time.toFixed(2) + "s";
				ctx.fillText(text, x + 2, 4);
			}
		}

		function labelFrequency(hz: number, l: boolean = true) {
			const y =
				height - (hertzToIndex(hz, visLen, sampleRate) * height) / visLen;
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			if (l) {
				const text = hz >= 1000 ? `${hz / 1000}k` : hz + "";
				ctx.fillText(text, 2, y + 4);
			}
		}
	}
}
