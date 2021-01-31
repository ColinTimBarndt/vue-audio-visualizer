let i = 0;

export default function uid() {
	return (Math.floor(Math.random() * 256) + i++) << 8;
}
