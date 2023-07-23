/* @refresh reload */
import {render} from 'solid-js/web';
import adapter from 'webrtc-adapter';
import {App} from './App';
import './index.css';

console.log('Quackmole browser used:' + adapter.browserDetails.browser);
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(() => <App/>, root);
