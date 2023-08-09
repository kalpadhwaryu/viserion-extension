const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
  mode: "development",
  devtool: "cheap-module-source-map",
  entry: {
    popup: path.resolve("./src/popup/popup.tsx"),
    background: path.resolve("./src/background/background.ts"),
  },
  module: {
    rules: [
      {
        use: "ts-loader",
        test: /\.ts$|tsx/,
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve("src/manifest.json"), to: path.resolve("dist") },
      ],
    }),
    new HtmlPlugin({
      title: "Viserion",
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new Dotenv(),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
  },
};
