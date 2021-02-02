module.exports = {
	css: {
		loaderOptions: {
			sass: {},
		},
	},
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
	},
};
