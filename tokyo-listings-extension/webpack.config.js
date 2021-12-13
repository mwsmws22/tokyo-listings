const path = require('path');

module.exports = {
  entry: './src/ServiceHandler.js',
  mode: 'development',
  output: {
    path: path.join(__dirname, 'dist/'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /.js$/,
        loader: 'babel-loader'
      }
    ]
  }
};
