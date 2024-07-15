const fs = require('fs');
const path = require('path');

function getEntries(dir) {
  return Object.assign.apply({},
    fs.readdirSync(dir, {
      withFileTypes: true
    })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => ({
      [`@flowplayer/components/${dirent.name}`]: `${dir}/${dirent.name}/index.ts`
    }))
  )
}

module.exports = {
  mode: "production",
  entry: getEntries("./packages"),
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: '[name].js',
  },
};
