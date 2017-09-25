import merge from 'lodash/merge';
import { RECEIVE_SEARCH } from '../actions/search_action';

const initialState = {
  query: undefined
};

const searchReducer = (state = initialState, action) => {
  Object.freeze(state);
  let newState;

  switch(action.type) {
    case RECEIVE_SEARCH:
      newState = {};
      newState.query = action.query;
      return newState;
    default:
      return state;
  }
};

export default searchReducer;
