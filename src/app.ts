// Oscillator instead of mic for debugging
const USE_OSCILLATOR: boolean = false;
const OSCILLATOR_HZ: number = 1000;

// Compatibility
if (!window.AudioContext)
	window.AudioContext = (window as any).webkitAudioContext as any;
if (!navigator.getUserMedia)
	navigator.getUserMedia =
		(navigator as any).mozGetUserMedia ||
		(navigator as any).webkitGetUserMedia ||
		(navigator as any).msGetUserMedia;

// Main
class App {
	// HTML elements
	protected readonly canvas: HTMLCanvasElement = document.createElement(
		"canvas"
	);
	// Context
	public readonly context: AudioContext = new AudioContext({
		// Low latency
		latencyHint: "interactive",
		//sampleRate: 44100,
	});
	protected readonly canvasCtx = this.canvas.getContext("2d", {
		// Low latency
		desynchronized: true,
		alpha: false,
	});
	// Audio nodes
	protected audioAnalyser = this.context.createAnalyser();
	protected audioBuffer = new Uint8Array(0);
	protected audioInputStream: MediaStream | null = null;
	protected audioInputNode: MediaStreamAudioSourceNode | null = null;
	protected audioFilter: BiquadFilterNode;
	protected audioAmplifier: GainNode;

	constructor(
		protected readonly visualizerElement: HTMLElement,
		protected readonly optionsElement: HTMLElement
	) {
		if (this.canvasCtx === null)
			throw new Error("2D rendering Context not supported by browser.");

		this.updateCanvasSize();
		window.addEventListener("resize", () => this.updateCanvasSize());

		this.drawVisualizer();

		this.visualizerElement.appendChild(this.canvas);

		this.audioAnalyser.fftSize = 2048;
		this.audioAnalyser.maxDecibels = -10;
		this.audioBuffer = new Uint8Array(this.audioAnalyser.frequencyBinCount * 2);

		this.audioFilter = this.context.createBiquadFilter();
		this.audioFilter.type = "bandpass";
		this.audioFilter.frequency.value = 900;
		this.audioFilter.Q.value = 20;

		this.audioAmplifier = this.context.createGain();
		this.audioAmplifier.gain.value = 5;

		this.audioFilter.connect(this.audioAmplifier);
		this.audioAmplifier.connect(this.audioAnalyser);

		if (USE_OSCILLATOR) {
			let oscillator = this.context.createOscillator();
			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(
				OSCILLATOR_HZ,
				this.context.currentTime
			);
			oscillator.connect(this.audioFilter);
			oscillator.start();
		} else {
			navigator.getUserMedia(
				{ audio: true },
				(stream) => {
					this.audioInputStream = stream;
					this.audioInputNode = this.context.createMediaStreamSource(stream);

					this.audioInputNode.channelCountMode = "explicit";
					this.audioInputNode.channelCount = 1;

					this.audioBuffer = new Uint8Array(
						this.audioAnalyser.frequencyBinCount
					);

					this.audioInputNode.connect(this.audioFilter);
				},
				(err) => console.error(err)
			);
		}
	}

	updateCanvasSize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvasCtx?.setTransform(1, 0, 0, -1, 0, this.canvas.height * 0.5);
	}

	drawVisualizer() {
		if (this.canvasCtx === null) return;

		const ctx = this.canvasCtx;
		ctx.globalAlpha = 0.8;
		ctx.fillStyle = "black";
		ctx.fillRect(
			0,
			-0.5 * this.canvas.height,
			this.canvas.width,
			this.canvas.height
		);
		ctx.globalAlpha = 1;

		// Draw FFT
		this.audioAnalyser.getByteFrequencyData(this.audioBuffer);

		const scale = this.canvas.height / (2 * 255);
		const { frequencyBinCount } = this.audioAnalyser;
		const { sampleRate } = this.context;
		{
			const step = this.canvas.width / frequencyBinCount;
			ctx.beginPath();
			ctx.moveTo(-step, this.audioBuffer[0] * scale);
			for (let index = 0; index < frequencyBinCount; index++) {
				ctx.lineTo(index * step, scale * this.audioBuffer[index]);
			}
			ctx.strokeStyle = "white";
			ctx.stroke();
		}

		// Get the highest dominant frequency

		const step = this.canvas.width / frequencyBinCount;

		let highestFreqHz = 0;
		{
			/**
			 * Highest frequency index in the buffer
			 */
			let highestFreqIndex = NaN;
			let highestFreqAmp = NaN;
			let remSteps = NaN;
			for (let i = frequencyBinCount - 1; i >= 0; i--) {
				const sample = this.audioBuffer[i];
				if (sample > 30) {
					if (isNaN(highestFreqAmp)) {
						highestFreqIndex = i;
						highestFreqAmp = sample;
					} else {
						if (sample > highestFreqAmp) {
							highestFreqIndex = i;
							highestFreqAmp = sample;
						}
					}
					//if (isNaN(remSteps)) remSteps = 100;
				}
				if (!isNaN(remSteps)) {
					if (remSteps-- < 0) break;
				}
			}

			if (!isNaN(highestFreqIndex)) {
				//highestFreqIndex =
				//	(OSCILLATOR_HZ * (2 * frequencyBinCount)) / sampleRate;
				ctx.beginPath();
				ctx.moveTo(highestFreqIndex * step, 0);
				ctx.lineTo(highestFreqIndex * step, scale * 255);
				ctx.strokeStyle = "green";
				ctx.stroke();

				highestFreqHz =
					(highestFreqIndex * sampleRate) / (2 * frequencyBinCount);
				(window as any).HZ = highestFreqHz;
			}
		}

		// Draw Audio
		this.audioAnalyser.getByteTimeDomainData(this.audioBuffer);

		{
			const iv = highestFreqHz == 0 ? 0 : 1 / highestFreqHz;

			const bufferSize = this.audioBuffer.length;
			const offsetY = -this.canvas.height / 2.4;

			const startIndex = Math.round(iv * sampleRate);
			const step = this.canvas.width / (this.audioBuffer.length - startIndex);
			const scale = this.canvas.height / (3 * 255);
			const offsetX =
				highestFreqHz == 0
					? 0
					: Math.round((this.context.currentTime % iv) * sampleRate) %
					  bufferSize;

			// Draw the audio graph with the given offset
			ctx.beginPath();
			ctx.moveTo(
				-step,
				this.audioBuffer[startIndex - offsetX] * scale + offsetY
			);

			for (let i = startIndex; i < bufferSize; i += 4) {
				const index = (i - offsetX) % bufferSize;
				const sample = this.audioBuffer[index];
				ctx.lineTo((i - startIndex) * step, scale * sample + offsetY);
			}
			ctx.strokeStyle = "white";
			ctx.stroke();
		}
	}
}

window.addEventListener("load", () => {
	const app = new App(
		document.getElementById("visualizer")!,
		document.getElementById("options")!
	);

	requestAnimationFrame(draw);

	function draw() {
		requestAnimationFrame(draw);
		app.drawVisualizer();
	}
});
