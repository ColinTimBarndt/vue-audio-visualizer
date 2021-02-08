const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
	publicPath: "",
	configureWebpack: {
		module: {
			rules: [
				{
					test: /\.worklet\.ts$/i,
					exclude: /node_modules/,
					use: [
						{
							loader: "worklet-loader",
							options: {
								name: "js/[hash].worklet.js",
								inline: true,
							},
						},
						{
							loader: "ts-loader",
							options: {
								configFile: "tsconfig.worklet.json",
								transpileOnly: true,
							},
						},
					],
				},
			],
		},
		plugins: [
			//new WasmPackPlugin({
			//	crateDirectory: path.resolve(__dirname, "wasm-fft"),
			//}),
		],
	},
};
