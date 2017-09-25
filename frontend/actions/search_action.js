import * as APIUtil from '../util/places_api_util';

export const RECEIVE_SEARCH = 'RECEIVE_SEARCH';
export const RECEIVE_ERRORS = 'RECEIVE_ERRORS';
export const CLEAR_ERRORS = 'CLEAR_ERRORS';

export const receiveSearch = (query) => {
  return {
    type: RECEIVE_SEARCH,
    query
  };
};

export const receiveErrors = (errors) => {
  return {
    type: RECEIVE_ERRORS,
    errors
  };
};

export const clearErrors = () => {
  return {
    type: CLEAR_ERRORS
  };
};

export const fetchSearchResults = (query) => dispatch => {
  return APIUtil.fetchSearchResults(query).then(
    resp => {
      dispatch(receiveSearch(resp));
      dispatch(clearErrors());
    },
    err => dispatch(receiveErrors(err))
  );
};
