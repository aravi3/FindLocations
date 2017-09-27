import React from 'react';
import merge from 'lodash/merge';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      error: [],
      map: undefined,
      latitude: undefined,
      longitude: undefined,
      locations: {},
      favorites: {},
      onFavorites: false
    };

    this.setSearch = this.setSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.toggleFavorite = this.toggleFavorite.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
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

    this.setState({ onFavorites: false });

    const request = {
      location: new google.maps.LatLng(this.state.latitude, this.state.longitude),
      radius: '20000',
      query: this.state.search
    }

    const service = new google.maps.places.PlacesService(this.state.map);
    service.textSearch(request, this.handleSearch);
  }

  handleSearch(results, status) {
    let locations = {};
    let result;

    switch (status) {
      case "OK":
        for (let i = 0; i < 10; i++) {
          result = {
            place_id: results[i].place_id,
            name: results[i].name,
            rating: results[i].rating,
            latitude: results[i].geometry.location.lat(),
            longitude: results[i].geometry.location.lng()
          };

          locations[results[i].place_id] = result;
        }

        this.setState({ error: [] });

        break;
      case "ERROR":
        this.setState({ error: ["There was a problem contacting the Google servers"] });
        break;
      case "INVALID_REQUEST":
        this.setState({ error: ["Invalid request"] });
        break;
      case "OVER_QUERY_LIMIT":
        this.setState({ error: ["Request quota exceeded"] });
        break;
      case "REQUEST_DENIED":
        this.setState({ error: ["This webpage is not allowed to use the PlacesService"] });
        break;
      case "UNKNOWN_ERROR":
        this.setState({ error: ["Request could not be processed due to a server error"] });
        break;
      case "ZERO_RESULTS":
        this.setState({ error: ["No results were found for this request"] });
        break;
      default:
    }

    this.setState({ locations });
  }

  toggleFavorite(e) {
    e.preventDefault();

    const favorites = merge({}, this.state.favorites);
    const isFavorite = this.state.favorites[e.target.dataset.id];

    if (isFavorite) {
      delete favorites[e.target.dataset.id];

      if (this.state.onFavorites) {
        this.setState({ locations: favorites });
      }
    }
    else {
      favorites[e.target.dataset.id] = {
        place_id: this.state.locations[e.target.dataset.id].place_id,
        name: this.state.locations[e.target.dataset.id].name,
        rating: this.state.locations[e.target.dataset.id].rating,
        latitude: this.state.locations[e.target.dataset.id].latitude,
        longitude: this.state.locations[e.target.dataset.id].longitude
      };
    }

    this.setState({ favorites });
  }

  showFavorites(e) {
    e.preventDefault();
    this.setState({ onFavorites: true });
    this.setState({ locations: this.state.favorites });
  }

  render() {
    let locations;

    if (this.state.error.length > 0) {
      locations = this.state.error.map((error, idx) => {
        return (<li className="error-item" key={`error-${idx}`}>{error}</li>);
      });
    }
    else {
      locations = Object.values(this.state.locations).map((location, idx) => {
        if (idx === this.state.locations.length - 1) {
          return (<li className="result-item bottom-result-item" key={`result-item-${idx}`} data-id={location.place_id}><i className={this.state.favorites[location.place_id] ? "fa fa-star" : "fa fa-star-o"}></i>{location.name}</li>);
        }
        else {
          return (<li className="result-item" key={`result-item-${idx}`} data-id={location.place_id}><i className={this.state.favorites[location.place_id] ? "fa fa-star" : "fa fa-star-o"}></i>{location.name}</li>);
        }
      });
    }

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

        <ul className="results" onClick={this.toggleFavorite}>
          {locations}
        </ul>
      </div>
    );
  }
}

export default Home;
