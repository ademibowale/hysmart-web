const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

// Inject environment variables that start with REACT_APP_
const envVars = {};
for (const key in process.env) {
  if (key.startsWith("REACT_APP_")) {
    envVars[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }
}

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    chunkFilename: "[name].[contenthash].chunk.js",
    clean: true,
    publicPath: "/",
  },
  resolve: {
    alias: {
      "react-native$": "react-native-web",
    },
    extensions: [".web.js", ".js", ".jsx", ".json"],
    fullySpecified: false,
    fallback: {
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
    },
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      maxSize: 200000,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: "react",
          chunks: "all",
          priority: 20,
          enforce: true,
        },
        supabase: {
          test: /[\\/]node_modules[\\/](@supabase|@floating-ui)[\\/]/,
          name: "supabase",
          chunks: "all",
          priority: 15,
          enforce: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          name: "common",
          chunks: "all",
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: "single",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: "asset/resource",
        generator: { filename: "images/[name][ext]" },
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        type: "asset/resource",
        generator: { filename: "fonts/[name][ext]" },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      filename: "index.html",
      inject: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: "",
          globOptions: {
            ignore: ["**/index.html"],
          },
          noErrorOnMissing: true,
        },
      ],
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      navigateFallback: "/offline.html",
      navigateFallbackDenylist: [/^\/api/, /^\/_next/, /^\/__/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "supabase-api",
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
        // ✅ IMPROVED API CACHING (with network timeout)
        {
          urlPattern: /\/api\//,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            networkTimeoutSeconds: 5, // 👈 prevents hanging on slow networks
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 10, // 10 minutes
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
          handler: "CacheFirst",
          options: {
            cacheName: "images",
            expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: "StaleWhileRevalidate",
          options: { cacheName: "static-resources" },
        },
      ],
    }),
    new webpack.DefinePlugin(envVars),
  ],
  devServer: {
    static: { directory: path.resolve(__dirname, "dist"), publicPath: "/" },
    historyApiFallback: true,
    port: 3001,
    open: true,
    hot: true,
    compress: true,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true, secure: false },
      "/uploads": { target: "http://localhost:3000", changeOrigin: true, secure: false },
    },
    client: { overlay: { errors: true, warnings: false }, progress: true },
    devMiddleware: { writeToDisk: true },
  },
  performance: {
    hints: false,
  },
  mode: "development",
  devtool: "source-map",
};