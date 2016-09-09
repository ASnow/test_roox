const webpack = require('webpack');
const conf = require('./gulp.conf');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const pkg = require('../package.json');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  module: {
    loaders: [
      {
        test: /.json$/,
        loaders: [
          'json'
        ]
      },
      {
        test: /\.(css|less)$/,
        loaders: ExtractTextPlugin.extract({
          fallbackLoader: 'style',
          loader: 'css?minimize!less!postcss'
        })
      },
      {
        test: /\.tsx$/,
        exclude: /node_modules/,
        loaders: [
          'ts'
        ]
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: conf.path.src('index.ejs'),
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/pages/main/main.ejs'),
      filename: 'components/pages/main/main.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/menu/menu.ejs'),
      filename: 'components/menu/menu.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/viewer.ejs'),
      filename: 'components/viewer.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/view_changer.ejs'),
      filename: 'components/view_changer.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/module_id.ejs'),
      filename: 'components/module_id.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/params.ejs'),
      filename: 'components/params.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/auth.ejs'),
      filename: 'components/auth.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: conf.path.src('components/web_api.ejs'),
      filename: 'components/web_api.html',
      inject: false
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
      'process.env.BASE_URL': '"http://localhost:3000/"'
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {unused: true, dead_code: true} // eslint-disable-line camelcase
    }),
    new ExtractTextPlugin('index-[contenthash].css'),
    new CopyWebpackPlugin([{ from: conf.path.src('public'), to: path.join(process.cwd(), conf.paths.dist, 'public') }], {copyUnmodified: true})
  ],
  postcss: () => [autoprefixer],
  output: {
    path: path.join(process.cwd(), conf.paths.dist),
    filename: '[name]-[hash].js'
  },
  resolve: {
    extensions: [
      '',
      '.webpack.js',
      '.web.js',
      '.js',
      '.ts',
      '.tsx'
    ]
  },
  entry: {
    app: `./${conf.path.src('index')}`,
    vendor: Object.keys(pkg.dependencies).filter(dep => ['todomvc-app-css'].indexOf(dep) === -1)
  },
  ts: {
    configFileName: 'tsconfig.json'
  },
  tslint: {
    configuration: require('../tslint.json')
  }
};
