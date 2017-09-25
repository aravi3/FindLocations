import { combineReducers } from 'redux';

import searchReducer from './search_reducer';
import errorsReducer from './errors_reducer';

const rootReducer = combineReducers({
  search: searchReducer,
  errors: errorsReducer
});

export default rootReducer;
