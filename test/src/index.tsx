/// <reference path="../typings/index.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {IStore} from '~react-redux~redux';
import {Provider} from 'react-redux';
import App from './app/containers/App';
import configureStore from './app/store/configureStore';
import {Router, Route, browserHistory} from 'react-router';

import 'todomvc-app-css/index.css';

const store: IStore<any> = configureStore({});


let gadgets: any = (window as any).gadgets;
gadgets.util.registerOnLoadHandler(function(){
  ReactDOM.render(
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path='/' component={App}>
          <Route path="public/widget.html"  />
        </Route>
      </Router>
    </Provider>,
    document.getElementById('app_container')
  );
});