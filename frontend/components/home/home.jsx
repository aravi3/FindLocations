import React from 'react';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      map: undefined,
      latitude: undefined,
      longitude: undefined,
      locations: []
    };

    this.setSearch = this.setSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    const currentLocation = navigator.geolocation;

    currentLocation.getCurrentPosition((position) => {
      this.setState({ latitude: position.coords.latitude });
      this.setState({ longitude: position.coords.longitude });

      const currentCoordinates = {lat: position.coords.latitude, lng: position.coords.longitude};

      this.setState({ map: new google.maps.Map(document.getElementById("map"), {
          center: currentCoordinates,
          zoom: 12
        })
      });

      const marker = new google.maps.Marker({
        position: currentCoordinates,
        map: this.state.map
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

    // const request = {
    //   location: new google.maps.LatLng(this.state.latitude, this.state.longitude),
    //   keyword: this.state.search,
    //   rankBy: google.maps.places.RankBy.DISTANCE
    // }

    const request = {
      location: new google.maps.LatLng(this.state.latitude, this.state.longitude),
      radius: '20000',
      query: this.state.search
    }

    const service = new google.maps.places.PlacesService(this.state.map);
    service.textSearch(request, this.handleSearch);
  }

  handleSearch(results, status) {
    let locations = [];

    if (status == google.maps.places.PlacesServiceStatus.OK) {
      for (let i = 0; i < results.length; i++) {
        locations.push(results[i]);
      }
    }

    console.log(locations);

    this.setState({ locations });
  }

  showFavorites() {
  }

  render() {
    return (
      <div>
        <div className="search">
          <form className="search-form" onSubmit={this.submitSearch}>
            <label className="search-bar"><i className="fa fa-search"></i>
              <input className="search-text" onChange={this.setSearch} placeholder="Search Locations" type="text" value={this.state.search} />
            </label>

            <input className="search-submit" type="submit" value="Search" />
          </form>

          <i className="fa fa-star fa-2x" onClick={this.showFavorites}></i>
        </div>

        <ul className="results">
          <li className="result-item"><i className="fa fa-star"></i>Some text</li>
          <li className="result-item"><i className="fa fa-star"></i>Some other text</li>
          <li className="result-item"><i className="fa fa-star"></i>{this.state.latitude ? this.state.latitude : "Loading"}</li>
          <li className="result-item"><i className="fa fa-star"></i>{this.state.longitude ? this.state.longitude : "Loading"}</li>
        </ul>
      </div>
    );
  }
}

export default Home;
