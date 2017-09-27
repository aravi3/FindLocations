import React from 'react';
import merge from 'lodash/merge';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: "",
      error: [],
      map: undefined,
      markers: [],
      latitude: undefined,
      longitude: undefined,
      locations: {},
      favorites: {},
      onFavorites: false,
      sortType: ""
    };

    this.setSearch = this.setSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
    this.degreesToRadians = this.degreesToRadians.bind(this);
    this.calculateHaversineDistance = this.calculateHaversineDistance.bind(this);
    this.toggleSort = this.toggleSort.bind(this);
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

      this.setState({ markers: [marker] });
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

    if (!this.state.search) {
      return;
    }

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
    const locations = {};
    const markers = [];
    let result, marker;

    switch (status) {
      case "OK":
        this.setState({ error: [] });
        this.setState({ sortType: "" });

        for (let i = 0; i < this.state.markers.length; i++ ) {
          this.state.markers[i].setMap(null);
        }

        for (let i = 0; i < results.length; i++) {
          result = {
            place_id: results[i].place_id,
            name: results[i].name,
            rating: results[i].rating,
            latitude: results[i].geometry.location.lat(),
            longitude: results[i].geometry.location.lng()
          };

          locations[results[i].place_id] = result;

          marker = new google.maps.Marker({
            position: {lat: result.latitude, lng: result.longitude},
            map: this.state.map
          });

          markers.push(marker);
        }

        this.setState({ markers });

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

  handleItemClick(e) {
    if (e.target.className.includes("fa-star")) {
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
    else if (e.target.className.includes("result-item")) {
      this.state.map.panTo({lat: this.state.locations[e.target.dataset.id].latitude, lng: this.state.locations[e.target.dataset.id].longitude});
      this.state.map.setZoom(15);
    }
  }

  showFavorites(e) {
    e.preventDefault();

    this.setState({ onFavorites: true });
    this.setState({ locations: this.state.favorites });

    for (let i = 0; i < this.state.markers.length; i++ ) {
      this.state.markers[i].setMap(null);
    }

    const markers = [];
    let marker;

    Object.values(this.state.favorites).forEach((favorite) => {
      marker = new google.maps.Marker({
        position: {lat: favorite.latitude, lng: favorite.longitude},
        map: this.state.map
      });

      markers.push(marker);
    });

    this.setState({ markers });
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const earthRadiusMiles = 3959;
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusMiles * c;

    return distance.toFixed(1);
  }

  toggleSort(type) {
    return (e) => {
      e.preventDefault();
      this.setState({ sortType: type });
    };
  }

  render() {
    let locations;

    if (this.state.error.length > 0) {
      locations = this.state.error.map((error, idx) => {
        return (<li className="error-item" key={`error-${idx}`}>{error}</li>);
      });
    }
    else {
      if (this.state.sortType === "distance") {
        let distance1, distance2;

        locations = Object.values(this.state.locations).sort((location1, location2) => {
          distance1 = this.calculateHaversineDistance(this.state.latitude, this.state.longitude, location1.latitude, location1.longitude);
          distance2 = this.calculateHaversineDistance(this.state.latitude, this.state.longitude, location2.latitude, location2.longitude);

          return distance1 - distance2;
        });
      }
      else if (this.state.sortType === "rating") {
        let rating;

        locations = Object.values(this.state.locations).sort((location1, location2) => {
          return location2.rating - location1.rating;
        });
      }
      else {
        locations = Object.values(this.state.locations);
      }

      locations = locations.map((location, idx) => {
        const distance = this.calculateHaversineDistance(this.state.latitude, this.state.longitude, location.latitude, location.longitude);

        return (
          <li className={idx === Object.values(this.state.locations).length - 1 ? "result-item bottom-result-item" : "result-item"} key={`result-item-${idx}`} data-id={location.place_id}>
            <i className={this.state.favorites[location.place_id] ? "fa fa-star" : "fa fa-star-o"} data-id={location.place_id}></i>
            {location.name}
            <br />
            <span className="location-details">Rating: {location.rating} &nbsp;&nbsp; Distance: {distance} mi</span>
          </li>
        );
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

        <ul className="results" onClick={this.handleItemClick}>
          {locations}
        </ul>

        {locations.length > 0 && this.state.error.length === 0 ?
          <div className="sort-options">
            <button className="sort-button" onClick={this.toggleSort("distance")}>Sort By Distance</button>
            <button className="sort-button" onClick={this.toggleSort("rating")}>Sort By Rating</button>
          </div>
          :
          <span></span>
        }
      </div>
    );
  }
}

export default Home;
