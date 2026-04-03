import Thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import mainReducer from './main/main.reducer';
import baselineDataReducer from './baselineData/baselineData.reducer';

const persistConfig = {
  key: 'root',
  storage,
  //   blacklist: ['auth'],
};

const baselinePersistConfig = {
  key: 'baselineData',
  storage,
  //   blacklist: ['documentRowPlaceholdersGenerated'],
};

const rootReducer = combineReducers({
  // @ts-ignore
  main: persistReducer(baselinePersistConfig, mainReducer),
  baselineData: persistReducer(baselinePersistConfig, baselineDataReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const composeEnhancers = (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
const store = createStore(persistedReducer, composeEnhancers(applyMiddleware(Thunk)));

const persistor = persistStore(store);

export default store;
export { persistor };
