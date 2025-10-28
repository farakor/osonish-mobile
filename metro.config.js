const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configure SVG transformer for SDK 54
try {
  const svgTransformer = require.resolve("react-native-svg-transformer");
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: svgTransformer,
  };

  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...config.resolver.sourceExts, "svg"],
    platforms: ["ios", "android", "native", "web"],
  };
} catch (error) {
  console.error(
    "⚠️ react-native-svg-transformer не найден. Установите его командой: npm install --save-dev react-native-svg-transformer"
  );
}

module.exports = config;
