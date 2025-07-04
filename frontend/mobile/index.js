import { AppRegistry } from 'react-native';
import App from './App'; // <- 경로 확인
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
