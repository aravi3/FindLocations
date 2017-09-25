const path = require('path');
let webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: './frontend/find_locations.jsx',
  output: {
    path: path.resolve(__dirname),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '*']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  },
  devtool: 'source-map'
};