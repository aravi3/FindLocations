import { connect } from 'react-redux';
import { receiveSearch } from '../../actions/search_action';
import Home from './home';

const mapStateToProps = (state) => {
  return {
    search: state.search
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    receiveSearch: () => dispatch(receiveSearch())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
