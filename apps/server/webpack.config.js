const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    memoryLimit: 4096,
  }),
  (config) => {
    config.devtool = 'source-map';

    return config;
  },
);
