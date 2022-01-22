import React from 'react';
import { Button, Form, Overlay, Popover } from 'react-bootstrap';
import { View } from "react-native";
import ListingDataService from "../services/listing.service";
import PropertyDataService from "../services/property.service";
import ScrapingService from "../services/scraping.service";
import { ListingAccordion } from "./listing-accordion.component";
import { removeNullProps, isUrlValid, formatAddress } from "../utils/util";
import Geocode from "react-geocode";
import equal from 'fast-deep-equal';

Geocode.setApiKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
Geocode.setLanguage("ja");
Geocode.setRegion("jp");

const cloneDeep = require('clone-deep');
const seedrandom = require('seedrandom')

const blankObj = {
  property: {
    id: null,
    prefecture: "",
    municipality: "",
    town: "",
    district: "",
    block: "",
    house_number: "",
    property_type: "",
    interest: "",
    lat: "",
    lng: "",
    exact: false
  },
  listing: {
    id: null,
    property_id: null,
    url: "",
    monthly_rent: "",
    reikin: "",
    security_deposit: "",
    square_m: "",
    closest_station: "",
    walking_time: "",
    availability: ""
  }
}

class AddListing extends React.Component {
  constructor(props) {
    super();
    this.handleInput = this.handleInput.bind(this);
    this.saveListing = this.saveListing.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleURL = this.handleURL.bind(this);
    this.setNestedStateVal = this.setNestedStateVal.bind(this);
    this.setNestedStateObj = this.setNestedStateObj.bind(this);
    this.viewOnMap = this.viewOnMap.bind(this);
    this.getExistingProperty = this.getExistingProperty.bind(this);
    this.checkProperty = this.checkProperty.bind(this);
    this.selectExistingProperty = this.selectExistingProperty.bind(this);
    this.setLatLng = props.setLatLng.bind(this);
    this.urlInput = React.createRef();
    this.overlay = React.createRef();

    this.state = {
      current_listing: cloneDeep(blankObj),
      previous_listings: [],
      similar_listings: [],
      show_previous: false,
      listing_exists: false,
      existing_property: -1,
      query: "",
      overlayKey: Math.random(),
      latlng: null,
      hideOverlay: false
    }
  }

  checkProperty() {
    if (this.state.current_listing.property.town !== "" && this.state.existing_property === -1) {
      const tempProperty = removeNullProps(cloneDeep(this.state.current_listing.property));
      let query = "?";

      for (const [key, value] of Object.entries(tempProperty)) {
        if (key !== "exact") {
          query += key + "=" + value + "&";
        }
      }

      if (this.state.query !== query) {
        PropertyDataService.getWithQuery(query)
          .then(response => {
            if (response.data.length > 0) {
              let listingQuery = "?";
              let tempProperties = response.data;

              tempProperties.forEach(property => listingQuery += "property_id[]=" + property.id + "&");

              ListingDataService.getWithQuery(listingQuery)
                .then(response => {
                  let simList = [];
                  response.data.forEach(listing => simList.push({listing: listing, property: tempProperties.filter(property => property.id === listing.property_id)[0]}));
                  this.setState({ similar_listings: simList.sort((a, b) => (Math.abs(a.listing.square_m - this.state.current_listing.listing.square_m) > Math.abs(b.listing.square_m - this.state.current_listing.listing.square_m)) ? 1 : -1) });
                  this.setState({ overlayKey: Math.random() });
                })
                .catch(e => {
                  console.log(e);
                });
            } else {
              this.setState({ similar_listings: [] });
            }
          })
          .catch(e => {
            console.log(e);
          });
      }
    }
  }

  handleInput(e, obj) {
    let x = this.state.current_listing;
    x[obj][e.target.name] = e.target.value;
    if (obj === "property") {
      this.setState({ current_listing: x }, this.checkProperty);
    } else if (e.target.name === "url") {
      this.setState({ current_listing: x });
    } else {
      this.setState({ current_listing: x });
    }
  }

  setNestedStateVal(obj, param, val) {
    let x = this.state.current_listing;
    x[obj][param] = val;
    this.setState({ current_listing: x });
  }

  setNestedStateObj(obj, val) {
    let x = this.state.current_listing;
    x[obj] = val;
    this.setState({ current_listing: x });
  }

  handleClick(e) {
    if (e) {e.preventDefault()};
  }

  handleURL(e) {
    this.handleInput(e, "listing");
    this.setState({listing_exists: false});

    let url = e.target.value;

    if (isUrlValid(url)) {
      ScrapingService.scrape(url)
        .then(response => {
          if (response.data.listing_exists) {
            this.setState({listing_exists: true});
            this.setNestedStateVal("listing", "url", response.data.url);
          } else if (response.data.url) {
            this.setNestedStateVal("listing", "url", response.data.url);
          } else {
            this.setState({current_listing: response.data}, this.checkProperty);
          }
        })
        .catch(e => {
          console.log(e);
      });
    }
  }

  getExistingProperty() {
    if (this.state.existing_property > -1) {
      PropertyDataService.getWithQuery("?id=" + this.state.existing_property.toString())
        .then(response => {
          this.setNestedStateObj("property", response.data[0]);
        })
        .catch(e => {
          console.log(e);
        });
    }
  }

  saveListing() {
    let currentProperty = cloneDeep(this.state.current_listing.property);

    if (this.state.latlng) {
      this.setLatLng(null);
      currentProperty["lat"] = this.state.latlng.lat;
      currentProperty["lng"] = this.state.latlng.lng;
      currentProperty["exact"] = true;
    }

    if (this.state.existing_property > -1) {
      PropertyDataService.update(this.state.existing_property, currentProperty)
        .then(response => {

          let tempListing = this.state.current_listing.listing;
          tempListing.property_id = this.state.existing_property;

          ListingDataService.create(removeNullProps(tempListing))
            .then(response => {

              const newEntry = {listing: response.data, property: this.state.current_listing.property};
              this.setState({
                previous_listings: [newEntry, ...this.state.previous_listings],
                current_listing: cloneDeep(blankObj),
                show_previous: true,
                similar_listings: [],
                query: "",
                existing_property: -1,
                latlng: null,
                hideOverlay: false
              });

            })
            .catch(e => {
              console.log(e);
          });
        })
        .catch(e => {
          console.log(e);
      });
    } else if (!this.state.latlng) {
      Geocode.fromAddress(formatAddress(currentProperty))
        .then((response) => {

          let tempPropWithLatLng = this.state.current_listing.property;
          tempPropWithLatLng.lat = response.results[0].geometry.location.lat;
          tempPropWithLatLng.lng = response.results[0].geometry.location.lng;

          PropertyDataService.create(removeNullProps(tempPropWithLatLng))
            .then(response => {

              let tempProperty = response.data;
              let tempListing = this.state.current_listing.listing;
              tempListing.property_id = tempProperty.id;

              ListingDataService.create(removeNullProps(tempListing))
                .then(response => {

                  const newEntry = {listing: response.data, property: tempProperty};
                  this.setState({
                    previous_listings: [newEntry, ...this.state.previous_listings],
                    current_listing: cloneDeep(blankObj),
                    show_previous: true,
                    similar_listings: [],
                    query: "",
                    existing_property: -1,
                    latlng: null,
                    hideOverlay: false
                  });

                })
                .catch(e => {
                  console.log(e);
              });
            })
            .catch(e => {
              console.log(e);
          });
        },
        (error) => {
          console.error(error);
        }
      );
    } else if (this.state.latlng) {
      PropertyDataService.create(removeNullProps(currentProperty))
        .then(response => {

          let tempProperty = response.data;
          let tempListing = this.state.current_listing.listing;
          tempListing.property_id = tempProperty.id;

          ListingDataService.create(removeNullProps(tempListing))
            .then(response => {

              const newEntry = {listing: response.data, property: tempProperty};
              this.setState({
                previous_listings: [newEntry, ...this.state.previous_listings],
                current_listing: cloneDeep(blankObj),
                show_previous: true,
                similar_listings: [],
                query: "",
                existing_property: -1,
                latlng: null,
                hideOverlay: false
              });

            })
            .catch(e => {
              console.log(e);
          });
        })
        .catch(e => {
          console.log(e);
      });
    }
  }

  viewOnMap() {
    this.setState({hideOverlay: true});
    Geocode.fromAddress(formatAddress(this.state.current_listing.property))
      .then((response) => {
        this.setLatLng({lat: response.results[0].geometry.location.lat, lng: response.results[0].geometry.location.lng});
      },
      (error) => {
        console.error(error);
      }
    );
  }

  selectExistingProperty(id) {
    this.setState({existing_property: id}, this.getExistingProperty);
  }

  componentDidUpdate(prevProps) {
    if (!equal(this.props.latlng, prevProps.latlng)) {
      this.setState({latlng: this.props.latlng});
    }
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18}}>Add a Listing</h4>
        <Form autoComplete="off" style={{paddingBottom: 8}}>
          <Form.Group>
            { this.state.listing_exists !== true ? <Form.Label>Listing URL</Form.Label> : <Form.Label className="text-danger">Listing already in DB!</Form.Label> }
            <Form.Control id="inputUrl" name="url" ref={this.urlInput} value={this.state.current_listing.listing.url} onChange={this.handleURL} placeholder="Enter URL"/>
            <Overlay key={this.state.overlayKey} target={this.urlInput.current} show={this.state.similar_listings.length > 0 && !this.state.hideOverlay} placement="right">
              <Popover style={{width: "600px", maxWidth: "600px"}} key={seedrandom(this.state.current_listing.listing.url)}>
                <Popover.Title as="h3">Similar Listings</Popover.Title>
                <Popover.Content>
                  <ListingAccordion listings={this.state.similar_listings} selectExistingProperty={this.selectExistingProperty} non_list_height={70} list_item_height={48} mode="similar"/>
                </Popover.Content>
              </Popover>
            </Overlay>
          </Form.Group>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Monthly Rent</Form.Label>
                <Form.Control name="monthly_rent" value={this.state.current_listing.listing.monthly_rent} onChange={ (e) => this.handleInput(e, "listing")} placeholder="万円"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
              <Form.Label>礼金</Form.Label>
              <Form.Control name="reikin" value={this.state.current_listing.listing.reikin} onChange={ (e) => this.handleInput(e, "listing")} placeholder="家賃の何ヶ月分"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>敷金</Form.Label>
                <Form.Control name="security_deposit" value={this.state.current_listing.listing.security_deposit} onChange={ (e) => this.handleInput(e, "listing")} placeholder="家賃の何ヶ月分"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>面積</Form.Label>
                <Form.Control name="square_m" value={this.state.current_listing.listing.square_m} onChange={ (e) => this.handleInput(e, "listing")} placeholder="m²"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Closest Station</Form.Label>
                <Form.Control name="closest_station" value={this.state.current_listing.listing.closest_station} onChange={ (e) => this.handleInput(e, "listing")} placeholder="Station Name"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>Walking Time</Form.Label>
                <Form.Control name="walking_time" value={this.state.current_listing.listing.walking_time} onChange={ (e) => this.handleInput(e, "listing")} placeholder="Minutes"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Prefecture</Form.Label>
                <Form.Control name="prefecture" value={this.state.current_listing.property.prefecture} onChange={ (e) => this.handleInput(e, "property")} placeholder="都道府県"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control name="municipality" value={this.state.current_listing.property.municipality} onChange={ (e) => this.handleInput(e, "property")} placeholder="市, 区"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Town</Form.Label>
                <Form.Control name="town" value={this.state.current_listing.property.town} onChange={ (e) => this.handleInput(e, "property")} placeholder="郡, 町, 村"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>District</Form.Label>
                <Form.Control name="district" value={this.state.current_listing.property.district} onChange={ (e) => this.handleInput(e, "property")} placeholder="丁目"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Block</Form.Label>
                <Form.Control name="block" value={this.state.current_listing.property.block} onChange={ (e) => this.handleInput(e, "property")} placeholder="番地"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>House #</Form.Label>
                <Form.Control name="house_number" value={this.state.current_listing.property.house_number} onChange={ (e) => this.handleInput(e, "property")} placeholder="号"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <Form.Group>
              <Form.Label>Availability</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "listing")}>
                <Form.Check checked={(this.state.current_listing.listing.availability === "募集中")} type="radio" value="募集中" name="availability" label="募集中" readOnly />
                <Form.Check checked={(this.state.current_listing.listing.availability === "契約済")} type="radio" value="契約済" name="availability" label="契約済" readOnly />
              </div>
            </Form.Group>
            <Form.Group style={{ paddingLeft: 60 }}>
              <Form.Label>Property Type</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "property")}>
                <Form.Check checked={(this.state.current_listing.property.property_type === "一戸建て")} type="radio" value="一戸建て" name="property_type" label="一戸建て" readOnly />
                <Form.Check checked={(this.state.current_listing.property.property_type === "アパート")} type="radio" value="アパート" name="property_type" label="アパート" readOnly />
              </div>
            </Form.Group>
            <Form.Group style={{ paddingLeft: 60 }}>
              <Form.Label>Interest</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "property")}>
                <View style={{flexDirection: "row"}}>
                  <View>
                    <Form.Check checked={(this.state.current_listing.property.interest === "Extremely")} type="radio" value="Extremely" name="interest" label="Extremely" readOnly />
                    <Form.Check checked={(this.state.current_listing.property.interest === "KindaMinus")} type="radio" value="KindaMinus" name="interest" label="Kinda-" readOnly />
                  </View>
                  <View style={{paddingLeft: 25}}>
                    <Form.Check checked={(this.state.current_listing.property.interest === "KindaPlus")} type="radio" value="KindaPlus" name="interest" label="Kinda+" readOnly />
                    <Form.Check checked={(this.state.current_listing.property.interest === "Nah")} type="radio" value="Nah" name="interest" label="Nah" readOnly />
                  </View>
                </View>
              </div>
            </Form.Group>
          </View>
          <div className="text-center" style={{paddingTop: 5}}>
            <Button disabled={this.state.listing_exists} onMouseDown={this.handleClick} onClick={this.saveListing} bg="dark" variant="dark">Submit</Button>{' '}
            <Button disabled={this.state.listing_exists} onMouseDown={this.handleClick} onClick={this.viewOnMap} bg="dark" variant="dark">Set Coordinates</Button>
          </div>
        </Form>
        { this.state.show_previous &&
          (<div key={this.state.previous_listings.length}>
            <div><hr/></div>
            <h4 className="text-center" style={{paddingBottom: 10}}>Previous Entries</h4>
            <ListingAccordion mode="previous" listings={this.state.previous_listings} non_list_height={715} list_item_height={48}/>
          </div>)
        }
      </div>
    );
  }
}

export default AddListing;
