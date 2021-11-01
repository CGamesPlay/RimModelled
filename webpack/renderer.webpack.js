const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const HotModuleReplacementPlugin =
  require("webpack").HotModuleReplacementPlugin;

const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
  },
  module: {
    rules: require("./rules.webpack"),
  },
  plugins: [
    isDevelopment && new ReactRefreshWebpackPlugin(),
    isDevelopment && new HotModuleReplacementPlugin(),
  ].filter(Boolean),
};
