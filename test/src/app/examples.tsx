
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as classnames from 'classnames';
import * as jQuery from 'jquery';

class PubSub {
  channel: string;
  listener: any;
  constructor(channel) {
    this.channel = channel;
    this.listener = () => {};
  }

  get() {
    return JSON.parse(localStorage.getItem(this.channel))[0];
  }

  publish(data: any) {
    localStorage.setItem(this.channel, JSON.stringify([data, Date.now()]));
    this.listener(this.get());
  }

  subscribe(listener: any) {
    this.listener = listener;
    window.addEventListener('storage', (e) => {
      if(e.key === this.channel) this.listener(this.get());
    }, false);
  }

}


const BASE_URL = "http://localhost:3000/";
const gadgets = (window as any).gadgets;
let UrlBuilder = (url: string) => `${BASE_URL}public/render.html?widget=${BASE_URL}${url}&renderType=iframe`
let Channel = new PubSub('test.pubsub');

class Frame extends React.Component<any, any> {
  render(){
    let source = UrlBuilder(this.props.url);
    return (
      <iframe id="remote_iframe_1" src={source}
        scrolling="auto"
        allowTransparency={true}
        className="some_widget_style" style={
          {display: "block", margin:0,padding:0, border: "none", background: "transparent"}
        }
        name="remote_iframe_0" {...this.props}>
      </iframe>
    )
  }
}


class Example1 extends React.Component<any, any> {
  constructor(prop: any, context: any) {
    super(prop, context);
    this.state = {tab: "components/menu/menu.html"}
  }

  hadleTabChange(tab: any){
    this.setState({tab})
  }

  componentDidMount(){
    if (gadgets && gadgets.pubsub){
      Channel.subscribe((tab) => {
        this.setState({tab});
      });
      console.log("Init sub");
    }else{
      console.log("Not init sub");
    }
  }

  render(){
    return (
      <div>
        <ul>
          <li>
            <a onClick={this.hadleTabChange.bind(this, 'components/view_changer.html&view=old')}>Item 1</a>
          </li>
          <li>
            <a onClick={this.hadleTabChange.bind(this, 'components/view_changer.html&view=new')}>Item 2</a>
          </li>
        </ul>
        <Frame url={this.state.tab} height="800" width="100%" />
      </div>
    )
  }
}

class BraodcastLink extends React.Component<any, any> {
  hadleClick = () => {
    if(gadgets.pubsub) {
      Channel.publish(this.props.message);
    }
    console.log("pub:", this.props.message);
  }
  render(){
    return (
      <li>
        <a onClick={this.hadleClick}>{this.props.name}</a>
      </li>
    );
  }

}

class Menu extends React.Component<any, any> {
  constructor(prop: any, context: any) {
    super(prop, context);
    this.state = {tab: "components/menu/menu.html"}
  }

  hadleTabChange(tab: any){
    this.setState({tab})
  }

  render(){
    let reactUrl = UrlBuilder('index.html');
    return (
      <div>
        <ul>
          <li>
            <a href={reactUrl} target="_top">React.js TODO</a>
          </li>
          <BraodcastLink name="View type" message="1" />
          <BraodcastLink name="__MODULE_ID__ injection" message={('components/module_id.html')} />
          <BraodcastLink name="Передача параметров" message={('components/params.html&up_portalBaseUrl=TEST_VAR')} />
          <BraodcastLink name="Auth" message="components/auth.html" />
          <BraodcastLink name="WebApi" message="components/web_api.html" />
        </ul>
      </div>
    )
  }
}

export default () => {
  try{
    ReactDOM.render(
      <Example1 />,
      document.getElementById('example1')
    );
  }catch(e){}

  try{
    ReactDOM.render(
      <Menu />,
      document.getElementById('menu')
    );
  }catch(e){}
}