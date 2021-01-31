// Compatibility
if (!window.AudioContext)
	window.AudioContext = (window as any).webkitAudioContext as any;
if (!navigator.getUserMedia)
	navigator.getUserMedia =
		(navigator as any).mozGetUserMedia ||
		(navigator as any).webkitGetUserMedia ||
		(navigator as any).msGetUserMedia;
