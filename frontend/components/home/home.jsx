import React from 'react';

class Home extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      search: "",
      latitude: undefined,
      longitude: undefined
    };
    
    this.setSearch = this.setSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
  }
  
  componentDidMount() {
    const currentLocation = navigator.geolocation;
    
    currentLocation.getCurrentPosition((position) => {
      this.setState({ latitude: position.coords.latitude });
      this.setState({ longitude: position.coords.longitude });
      
      const map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: position.coords.latitude, lng: position.coords.longitude},
        zoom: 12
      });
    });
  }
  
  setSearch(e) {
    e.preventDefault();
    const search = e.target.value ? e.target.value : "";
    this.setState({ search });
    setTimeout(() => console.log(this.state.search), 0);
  }
  
  submitSearch(e) {
    e.preventDefault();
  }

  render() {
    return (
      <div>
        <section className="search">
          <form className="search-form" onSubmit={this.submitSearch}>
            <label className="search-bar"><i className="fa fa-search"></i>
              <input className="search-text" onChange={this.setSearch} placeholder="Search Locations" type="text" value={this.state.search} />
            </label>
            
            <input className="search-submit" type="submit" value="Search" />
          </form>
          
          <ul className="results">
            <li className="result-item">Some text</li>
            <li className="result-item">Some other text</li>
            <li className="result-item">{this.state.latitude ? this.state.latitude : "Loading"}</li>
            <li className="result-item bottom-result-item">{this.state.longitude ? this.state.longitude : "Loading"}</li>  
          </ul>
        </section>
      </div>
    );
  }
}

export default Home;
