import React from 'react';
import merge from 'lodash/merge';

class Home extends React.Component {
  constructor(props) {
    super(props);

    // Initialize local state
    // If items exists in localStorage, set these to the initial values
    this.state = {
      error: [],
      map: undefined,
      markers: [],
      latitude: parseFloat(localStorage.getItem("latitude")) || undefined,
      longitude: parseFloat(localStorage.getItem("longitude")) || undefined,
      locations: JSON.parse(localStorage.getItem("locations")) || {},
      favorites: JSON.parse(localStorage.getItem("favorites")) || {},
      onFavorites: localStorage.getItem("onFavorites") === "true" || false,
      sortType: localStorage.getItem("sortType") || ""
    };

    // Set context for component functions
    this.submitSearch = this.submitSearch.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
    this.degreesToRadians = this.degreesToRadians.bind(this);
    this.calculateHaversineDistance = this.calculateHaversineDistance.bind(this);
    this.toggleSort = this.toggleSort.bind(this);
    this.setAutocomplete = this.setAutocomplete.bind(this);
  }

  // On mount of the component, create the map and set center coordinates
  componentDidMount() {
    if (this.state.onFavorites) { this.setState({ locations: this.state.favorites }); }

    const currentLocation = navigator.geolocation;

    currentLocation.getCurrentPosition((position) => {
      this.setState({ latitude: position.coords.latitude });
      this.setState({ longitude: position.coords.longitude });

      const currentCoordinates = {lat: position.coords.latitude, lng: position.coords.longitude};

      // If map already exists in localStorage, use this map to center around
      // the user's current coordinates
      // Else, create a new map
      if (this.state.map) {
        this.state.map.panTo(currentCoordinates);
      }
      else {
        this.setState({ map: new google.maps.Map(document.getElementById("map"), {
            center: currentCoordinates,
            zoom: 12
          })
        });
      }

      localStorage.setItem("latitude", currentCoordinates.lat.toString());
      localStorage.setItem("longitude", currentCoordinates.lng.toString());
    });

    // The above getCurrentPosition function returns immediately because it is
    // asynchronous
    // Therefore, in the meantime, either create a new map based on coordinates
    // that exist in localStorage else use the coordinates of the Ferry Building
    if (this.state.latitude && this.state.longitude) {
      this.setState({ map: new google.maps.Map(document.getElementById("map"), {
          center: {lat: this.state.latitude, lng: this.state.longitude},
          zoom: 12
        })
      });
    }
    else {
      const ferryBuildingCoordinates = {lat: 37.7956, lng: -122.3933};

      this.setState({ latitude: ferryBuildingCoordinates.lat });
      this.setState({ longitude: ferryBuildingCoordinates.lng });
      this.setState({ map: new google.maps.Map(document.getElementById("map"), {
          center: ferryBuildingCoordinates,
          zoom: 12
        })
      });

      localStorage.setItem("latitude", ferryBuildingCoordinates.lat.toString());
      localStorage.setItem("longitude", ferryBuildingCoordinates.lng.toString());
    }

    // If a list of locations exist in localStorage, create markers for them
    // on the map
    setTimeout(() => {
      if (Object.keys(this.state.locations).length > 0) {
        const markers = [];

        Object.values(this.state.locations).forEach((location) => {
          let marker = new google.maps.Marker({
            position: {lat: location.latitude, lng: location.longitude},
            map: this.state.map,
            title: location.place_id
          });

          markers.push(marker);
        });

        this.setState({ markers });
      }
    }, 0);
  }

  // Make a request to the Google Places API based on the query string
  // Parameter: event, Return value: none
  submitSearch(e) {
    e.preventDefault();

    const searchText = e.target.querySelector(".search-text").value;

    if (!searchText) {
      return;
    }

    this.setState({ onFavorites: false });

    localStorage.setItem("onFavorites", "false");

    const request = {
      location: new google.maps.LatLng(this.state.latitude, this.state.longitude),
      radius: '20000',
      query: searchText
    }

    const service = new google.maps.places.PlacesService(this.state.map);
    service.textSearch(request, this.handleSearch);
  }

  // If results were retrieved, populate locations in the local state and
  // create a marker for each location on the map
  // If results were not able to be retrieved, set the appropriate error in the local state
  // Parameters: result of the API request, status of the request, Return value: none
  handleSearch(results, status) {
    const locations = {};
    const markers = [];
    const error = [];
    let result, marker, letters
    let letterIndex = 0;

    switch (status) {
      case "OK":
        this.setState({ error: [] });
        this.setState({ sortType: "" });

        for (let i = 0; i < this.state.markers.length; i++ ) {
          this.state.markers[i].setMap(null);
        }

        for (let i = 0; i < results.length; i++) {
          letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

          result = {
            place_id: results[i].place_id,
            name: results[i].name,
            rating: results[i].rating,
            latitude: results[i].geometry.location.lat(),
            longitude: results[i].geometry.location.lng(),
            letter: letters[letterIndex]
          };

          locations[results[i].place_id] = result;

          marker = new google.maps.Marker({
            position: {lat: result.latitude, lng: result.longitude},
            map: this.state.map,
            title: result.place_id,
            label: letters[letterIndex]
          });

          markers.push(marker);

          letterIndex++;
        }

        this.setState({ markers });

        break;
      case "ERROR":
        error.push("There was a problem contacting the Google servers");
        break;
      case "INVALID_REQUEST":
        error.push("Invalid request");
        break;
      case "OVER_QUERY_LIMIT":
        error.push("Request quota exceeded");
        break;
      case "REQUEST_DENIED":
        error.push("This webpage is not allowed to use the PlacesService");
        break;
      case "UNKNOWN_ERROR":
        error.push("Request could not be processed due to a server error");
        break;
      case "ZERO_RESULTS":
        error.push("No results were found for this request");
        break;
      default:
    }

    this.setState({ error });
    this.setState({ locations });

    localStorage.setItem("locations", JSON.stringify(locations));
  }

  // If the user clicks the star next to a location, toggle the location's
  // favorite status
  // If the user clicks a location, set the map center to the location and increase
  // the zoom to 15
  // Parameter: event, Return value: none
  handleItemClick(e) {
    if (e.target.className.includes("fa-star")) {
      const favorites = merge({}, this.state.favorites);
      const isFavorite = this.state.favorites[e.target.dataset.id];

      if (isFavorite) {
        const placeId = favorites[e.target.dataset.id].place_id;

        delete favorites[e.target.dataset.id];

        if (this.state.onFavorites) {
          this.setState({ locations: favorites });

          // If user is on favorites tab, remove the marker for the location
          // from the map
          this.state.markers.filter((marker) => {
            return marker.title === placeId;
          })[0].setMap(null);
        }
      }
      else {
        favorites[e.target.dataset.id] = {
          place_id: this.state.locations[e.target.dataset.id].place_id,
          name: this.state.locations[e.target.dataset.id].name,
          rating: this.state.locations[e.target.dataset.id].rating,
          latitude: this.state.locations[e.target.dataset.id].latitude,
          longitude: this.state.locations[e.target.dataset.id].longitude,
          letter: this.state.locations[e.target.dataset.id].letter
        };
      }

      this.setState({ favorites });
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
    else if (e.target.className.includes("result-item")) {
      this.state.map.panTo({lat: this.state.locations[e.target.dataset.id].latitude, lng: this.state.locations[e.target.dataset.id].longitude});
      this.state.map.setZoom(15);
    }
  }

  // Show the list of favorited locations when the star next to the search
  // button is clicked and create a marker for each favorite on the map
  // Parameter: event, Return value: none
  showFavorites(e) {
    e.preventDefault();

    this.setState({ onFavorites: true });
    this.setState({ locations: this.state.favorites });

    localStorage.setItem("onFavorites", "true");

    // Remove current markers on map
    for (let i = 0; i < this.state.markers.length; i++ ) {
      this.state.markers[i].setMap(null);
    }

    const markers = [];
    let marker;

    // Set new markers for favorites
    Object.values(this.state.favorites).forEach((favorite) => {
      marker = new google.maps.Marker({
        position: {lat: favorite.latitude, lng: favorite.longitude},
        map: this.state.map,
        title: favorite.place_id
      });

      markers.push(marker);
    });

    this.setState({ markers });
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Calculate the great-circle distance between two coordinates
  // Parameters: two sets of coordinates, Return value: distance in miles
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

  // Set the sortType in the local state to distance or ranking depending on
  // which sort button was clicked
  // Parameter: either "distance" or "rating", Return value: none
  toggleSort(type) {
    return (e) => {
      e.preventDefault();
      this.setState({ sortType: type });
      localStorage.setItem("sortType", type);
    };
  }

  // Set the autocomplete for the query box when the box receives focus
  // Parameter: event, Return value: none
  setAutocomplete(e) {
    e.preventDefault();
    const options = {};
    const autocomplete = new google.maps.places.Autocomplete(e.target, options);
  }

  render() {
    let locations;

    if (this.state.error.length > 0) {
      locations = this.state.error.map((error, idx) => {
        return (<li className="error-item" key={`error-${idx}`}>{error}</li>);
      });
    }
    else if (this.state.onFavorites && Object.keys(this.state.locations).length === 0) {
      locations = ["No favorite locations to show"].map((noFavorites, idx) => {
        return (<li className="no-favorites-item" key={`no-favorites-${idx}`}>{noFavorites}</li>);
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

            <span className="location-name">{location.name}</span> <span className="location-letter">{location.letter}</span>

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
              <input className="search-text" onFocus={this.setAutocomplete} placeholder="Search Locations" type="text" />
            </label>

            <input className="search-submit" type="submit" value="Search" />
          </form>

          <i className="fa fa-star fa-2x" onClick={this.showFavorites}></i>
        </div>

        <ul className="results" onClick={this.handleItemClick}>
          {locations}
        </ul>

        {Object.keys(this.state.locations).length > 0 && this.state.error.length === 0 ?
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
