export const RECEIVE_SEARCH = 'RECEIVE_SEARCH';

export const receiveSearch = (query) => {
  return {
    type: RECEIVE_SEARCH,
    query
  };
};
