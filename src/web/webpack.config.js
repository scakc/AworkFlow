const path = require('path');

module.exports = {
  entry: './jsx/index.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'js')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,  // ✅ Add this for CSS
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.tsx', '.ts']
  },
  mode: 'development'
};
