use js_sys::Float32Array;
use rustfft::{num_complex::Complex, Fft, FftPlanner};
use std::{fmt, sync::Arc, vec};
use wasm_bindgen::prelude::*;
use web_sys::console;

static mut INSTANCE: Option<WindowedFFT> = None;
const PI2: f32 = 2.0 * std::f32::consts::PI;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
/// The type of a FFT window.
pub enum WindowType {
    /// A basic half cosine curve with its maximum in the middle.
    Hanning = 1,
    /// Like `Hanning`, but with some scaling applied.
    Hamming = 2,
    /// Similar to the `Hamming` window, but the width of the main
    /// lobe is 50% wider.
    Blackman = 3,
    /// Similar to `Blackman`.
    BlackmanHarris = 4,
    /// A linear abs-function. The ends are non-zero.
    Parzen = 5,
    /// Like `Parzen`, but squared (`1 - (etc * etc)`).
    Welch = 6,
}

pub struct WindowedFFT {
    pub window: Option<WindowType>,
    fft: Arc<dyn Fft<f32>>,
    buffer: Vec<Complex<f32>>,
    abs_buffer: Vec<f32>,
    scratch: Vec<Complex<f32>>,
    window_mod: Vec<f32>,
}

#[wasm_bindgen(start)]
pub fn start() {
    console::log_3(
        &JsValue::from_str("%c[WASM-FFT]%c Loaded WASM FFT"),
        &JsValue::from_str(
            "color:white;background:#2c3e50;border-radius:3px;padding:1px 3px;display:inline-block",
        ),
        &JsValue::from_str(""),
    );
}

#[wasm_bindgen(js_name = "set")]
pub fn set_fft(fft_size: usize, window: Option<WindowType>) {
    unsafe {
        INSTANCE = Some(WindowedFFT::new(fft_size, window));
    }
}

#[wasm_bindgen(js_name = "setWindow")]
pub fn set_fft_window(window: Option<WindowType>) {
    unsafe {
        if let Some(ref mut inst) = INSTANCE {
            inst.set_window(window);
        }
    }
}

#[wasm_bindgen(js_name = "delete")]
pub fn delete_fft() {
    unsafe {
        INSTANCE = None;
    }
}

#[wasm_bindgen(js_name = "process")]
pub fn process_fft(samples: &Float32Array) {
    unsafe {
        if let Some(ref mut inst) = INSTANCE {
            inst.process_js_array_windowed(samples);
        }
    }
}

/// Gets the result buffer from the FFT
#[wasm_bindgen(getter, js_name = "buffer")]
pub fn get_buffer() -> Option<Float32Array> {
    unsafe {
        if let Some(ref mut inst) = INSTANCE {
            Some(Float32Array::view(&inst.abs_buffer))
        } else {
            None
        }
    }
}

// BUG: https://github.com/rustwasm/wasm-bindgen/issues/1715
//#[wasm_bindgen]
impl WindowType {
    //#[wasm_bindgen(constructor)]
    #[inline]
    pub fn new(variant: &str) -> Option<WindowType> {
        Self::from_name(variant)
    }
    //#[wasm_bindgen(js_name = "toString")]
    #[inline]
    pub fn js_to_string(self) -> JsValue {
        return JsValue::from_str(self.get_name());
    }
}
// TextEncoder is not supported in a Worklet context
//#[wasm_bindgen(js_name = "newWindowType")]
//pub fn window_type_new(variant: &str) -> Option<WindowType> {
//    WindowType::new(variant)
//}

// TextDecoder is not supported in a Worklet context
//#[wasm_bindgen(js_name = "toStringWindowType")]
//pub fn window_type_to_string(t: WindowType) -> JsValue {
//    WindowType::js_to_string(t)
//}

impl WindowType {
    pub const VARIANTS: [&'static str; 6] = [
        WindowType::Hanning.get_name(),
        WindowType::Hamming.get_name(),
        WindowType::Blackman.get_name(),
        WindowType::BlackmanHarris.get_name(),
        WindowType::Parzen.get_name(),
        WindowType::Welch.get_name(),
    ];
    pub const fn get_name(self) -> &'static str {
        match self {
            Self::Hanning => "Hanning",
            Self::Hamming => "Hamming",
            Self::Blackman => "Blackman",
            Self::BlackmanHarris => "Blackman Harris",
            Self::Parzen => "Parzen",
            Self::Welch => "Welch",
        }
    }
    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            v if v.eq_ignore_ascii_case(Self::Hanning.get_name()) => Some(Self::Hanning),
            v if v.eq_ignore_ascii_case(Self::Hamming.get_name()) => Some(Self::Hamming),
            v if v.eq_ignore_ascii_case(Self::Blackman.get_name()) => Some(Self::Blackman),
            v if v.eq_ignore_ascii_case(Self::BlackmanHarris.get_name()) => {
                Some(Self::BlackmanHarris)
            }
            v if v.eq_ignore_ascii_case(Self::Parzen.get_name()) => Some(Self::Parzen),
            v if v.eq_ignore_ascii_case(Self::Welch.get_name()) => Some(Self::Welch),
            _ => None,
        }
    }
    pub fn get_modifier(self, buffer: &mut [f32]) {
        let ni = buffer.len();
        let n = ni as f32;
        let nn = PI2 / (n - 1.0);
        match self {
            Self::Hanning => {
                for ii in 0..ni {
                    let i = ii as f32;
                    buffer[ii] = 0.5 - 0.5 * (i * nn).cos();
                }
            }
            Self::Hamming => {
                for ii in 0..ni {
                    let i = ii as f32;
                    buffer[ii] = 0.54 - 0.46 * (i * nn).cos();
                }
            }
            Self::Blackman => {
                let a = 0.16;
                let ha = 0.5 * a;
                let af = 0.5 - ha;
                for ii in 0..ni {
                    let i = ii as f32;
                    let z = i * nn;
                    buffer[ii] = af - 0.5 * z.cos() + ha * (2.0 * z).cos();
                }
            }
            Self::BlackmanHarris => {
                for ii in 0..ni {
                    let i = ii as f32;
                    let z = i * nn;
                    buffer[ii] = 0.35875 - 0.48829 * z.cos() + 0.14128 * (2.0 * z).cos()
                        - 0.01168 * (3.0 * z).cos();
                }
            }
            Self::Parzen => {
                let hn = 0.5 * n;
                // 0.5 * (n - 1)
                let hm = hn - 0.5;
                // 1 / (0.5 * (n + 1))
                let s = 1.0 / (hn + 0.5);
                for ii in 0..ni {
                    let i = ii as f32;
                    buffer[ii] = 1.0 - ((i - hm) * s).abs();
                }
            }
            Self::Welch => {
                let hn = 0.5 * n;
                // 0.5 * (n - 1)
                let hm = hn - 0.5;
                // 0.5 * (n + 1)
                let hp = hn + 0.5;
                // [ 1 / (0.5 * (n + 1)) ]²
                let sq = 1.0 / (hp * hp);
                for ii in 0..ni {
                    let i = ii as f32;
                    let a = i - hm;
                    buffer[ii] = 1.0 - a * a * sq;
                }
            }
        }
    }
}

impl fmt::Display for WindowType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.get_name())
    }
}

impl WindowedFFT {
    #[inline]
    pub fn new(fft_size: usize, window: Option<WindowType>) -> Self {
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(fft_size);
        Self {
            buffer: vec![Default::default(); fft_size],
            abs_buffer: vec![Default::default(); fft_size],
            scratch: vec![Default::default(); fft.get_inplace_scratch_len()],
            window_mod: window.map_or(Vec::with_capacity(0), |w| {
                let mut buf = vec![0.0; fft_size];
                w.get_modifier(&mut buf[..]);
                buf
            }),
            window,
            fft,
        }
    }
    #[inline]
    pub fn process(&mut self) {
        self.fft
            .process_with_scratch(&mut self.buffer, &mut self.scratch);
        let mut i = 0;
        for Complex { re, im: _ } in &self.buffer {
            self.abs_buffer[i] = *re;
            i += 1;
        }
    }
    #[inline]
    pub fn process_js_array_windowed(&mut self, array: &Float32Array) {
        if self.window.is_some() {
            array.for_each(&mut |sample: f32, i, _| {
                let ii = i as usize;
                self.buffer[ii] = Complex::new(sample * self.window_mod[ii], 0.0);
            });
        } else {
            array.for_each(&mut |sample: f32, i, _| {
                let ii = i as usize;
                self.buffer[ii] = Complex::new(sample, 0.0);
            });
        }

        self.process();
    }
    #[inline]
    pub fn set_window(&mut self, window: Option<WindowType>) {
        if self.window.eq(&window) {
            return;
        }
        if let Some(w) = window {
            if self.window_mod.len() < self.fft.len() {
                self.window_mod.resize(self.fft.len(), 0.0);
                w.get_modifier(&mut self.window_mod[..]);
            }
        } else {
            self.window_mod = Vec::with_capacity(0);
        }
        self.window = window;
    }
}
