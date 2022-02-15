import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { View } from "react-native";
import ListingDataService from "../services/listing.service";
import PropertyDataService from "../services/property.service";
import { removeNullProps } from "../utils/util";
import equal from 'fast-deep-equal';

const cloneDeep = require('clone-deep');

class EditProperty extends React.Component {
  constructor(props) {
    super();
    this.handleInput = this.handleInput.bind(this);
    this.saveListing = this.saveListing.bind(this);
    this.updateOnEdit = props.updateOnEdit.bind(this);
    this.deleteListing = this.deleteListing.bind(this);
    this.deleteProperty = this.deleteProperty.bind(this);

    this.state = {
      property: props.property,
      edit_listing: props.listingId ?  props.property.listings.filter(l => l.id === props.listingId)[0] : props.property.listings[0],
      click: {
        lat: "",
        lng: ""
      }
    }
  }

  handleInput(e, obj) {
    if (obj === "property") {
      let x = this.state.property;
      x[e.target.name] = e.target.value;
      this.setState({ property: x });
    } else if (obj === "listing") {
      let x = this.state.edit_listing;
      x[e.target.name] = e.target.value;
      this.setState({ edit_listing: x });
    }
  }

  componentDidUpdate(prevProps) {
    if (!equal(this.props.latlng, prevProps.latlng)) {
      this.setState({click: this.props.latlng});
    }
  }

  saveListing() {
    let tempProperty = cloneDeep(this.state.property);

    if (this.state.click.lat !== "" && this.state.click.lng !== "") {
      tempProperty["lat"] = this.state.click.lat;
      tempProperty["lng"] = this.state.click.lng;
      tempProperty["exact"] = true;
    }

    PropertyDataService.update(this.state.property.id, removeNullProps(tempProperty))
      .then(response => {

        ListingDataService.update(this.state.edit_listing.id, removeNullProps(this.state.edit_listing))
          .then(response => {
            this.updateOnEdit("update info");
          })
          .catch(e => {
            console.log(e);
        });
      })
      .catch(e => {
        console.log(e);
    });
  }

  deleteProperty() {
    this.state.property.listings.forEach(function(l) {
      ListingDataService.remove(l.id)
        .catch(e => {
          console.log(e);
      });
    });

    PropertyDataService.remove(this.state.property.id)
      .then(response => {
        this.updateOnEdit("delete property")
      })
      .catch(e => {
        console.log(e);
    });
  }

  deleteListing() {
    ListingDataService.remove(this.state.edit_listing.id)
      .then(response => {
        this.updateOnEdit("delete listing");
      })
      .catch(e => {
        console.log(e);
    });
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18}}>Edit Listing</h4>
        <Form autoComplete="off" style={{paddingBottom: 8}}>
          <Form.Group>
            <Form.Label>Listing URL</Form.Label>
            <Form.Control name="url" value={this.state.edit_listing.url} onChange={ (e) => this.handleInput(e, "listing") } placeholder="Enter URL"/>
          </Form.Group>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Monthly Rent</Form.Label>
                <Form.Control name="monthly_rent" value={this.state.edit_listing.monthly_rent} onChange={ (e) => this.handleInput(e, "listing")} placeholder="万円"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
              <Form.Label>礼金</Form.Label>
              <Form.Control name="reikin" value={this.state.edit_listing.reikin} onChange={ (e) => this.handleInput(e, "listing")} placeholder="家賃の何ヶ月分"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>敷金</Form.Label>
                <Form.Control name="security_deposit" value={this.state.edit_listing.security_deposit} onChange={ (e) => this.handleInput(e, "listing")} placeholder="家賃の何ヶ月分"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>面積</Form.Label>
                <Form.Control name="square_m" value={this.state.edit_listing.square_m} onChange={ (e) => this.handleInput(e, "listing")} placeholder="m²"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Closest Station</Form.Label>
                <Form.Control name="closest_station" value={this.state.edit_listing.closest_station} onChange={ (e) => this.handleInput(e, "listing")} placeholder="Station Name"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>Walking Time</Form.Label>
                <Form.Control name="walking_time" value={this.state.edit_listing.walking_time} onChange={ (e) => this.handleInput(e, "listing")} placeholder="Minutes"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Prefecture</Form.Label>
                <Form.Control name="prefecture" value={this.state.property.prefecture} onChange={ (e) => this.handleInput(e, "property")} placeholder="都 / 県"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control name="municipality" value={this.state.property.municipality} onChange={ (e) => this.handleInput(e, "property")} placeholder="市 / 区"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Town</Form.Label>
                <Form.Control name="town" value={this.state.property.town} onChange={ (e) => this.handleInput(e, "property")} placeholder="町"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>District</Form.Label>
                <Form.Control name="district" value={this.state.property.district} onChange={ (e) => this.handleInput(e, "property")} placeholder="丁目"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Block</Form.Label>
                <Form.Control name="block" value={this.state.property.block} onChange={ (e) => this.handleInput(e, "property")} placeholder="番"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>House #</Form.Label>
                <Form.Control name="house_number" value={this.state.property.house_number} onChange={ (e) => this.handleInput(e, "property")} placeholder="号"/>
              </Form.Group>
            </View>
          </View>
          <View style={{flexDirection: "row"}}>
            <Form.Group>
              <Form.Label>Availability</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "listing")}>
                <Form.Check checked={(this.state.edit_listing.availability === "募集中")} type="radio" value="募集中" name="availability" label="募集中" readOnly />
                <Form.Check checked={(this.state.edit_listing.availability === "契約済")} type="radio" value="契約済" name="availability" label="契約済" readOnly />
              </div>
            </Form.Group>
            <Form.Group style={{ paddingLeft: 60 }}>
              <Form.Label>Property Type</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "property")}>
                <Form.Check checked={(this.state.property.property_type === "一戸建て")} type="radio" value="一戸建て" name="property_type" label="一戸建て" readOnly />
                <Form.Check checked={(this.state.property.property_type === "アパート")} type="radio" value="アパート" name="property_type" label="アパート" readOnly />
              </div>
            </Form.Group>
            <Form.Group style={{ paddingLeft: 60 }}>
              <Form.Label>Interest</Form.Label>
              <div onChange={ (e) => this.handleInput(e, "property")}>
                <View style={{flexDirection: "row"}}>
                  <View>
                    <Form.Check checked={(this.state.property.interest === "Extremely")} type="radio" value="Extremely" name="interest" label="Extremely" readOnly />
                    <Form.Check checked={(this.state.property.interest === "KindaMinus")} type="radio" value="KindaMinus" name="interest" label="Kinda-" readOnly />
                  </View>
                  <View style={{paddingLeft: 25}}>
                    <Form.Check checked={(this.state.property.interest === "KindaPlus")} type="radio" value="KindaPlus" name="interest" label="Kinda+" readOnly />
                    <Form.Check checked={(this.state.property.interest === "Nah")} type="radio" value="Nah" name="interest" label="Nah" readOnly />
                  </View>
                </View>
              </div>
            </Form.Group>
          </View>
          <div className="text-center" style={{paddingTop: 5}}>
            <Button onClick={this.saveListing} bg="dark" variant="dark">Update</Button>
          </div>
          <div><hr/></div>
          { this.state.property.listings.length > 1
            ? (<div className="text-center" style={{paddingTop: 5}}>
                <Button bg="dark" onClick={this.deleteListing} variant="danger">Delete Listing</Button>{' '}
                <Button bg="dark" onClick={this.deleteProperty} variant="danger">Delete Property</Button>
              </div>)
            : (<div className="text-center" style={{paddingTop: 5}}>
                <Button bg="dark" onClick={this.deleteProperty} variant="danger">Delete Property</Button>
              </div>)
          }
        </Form>
      </div>
    );
  }
}

export default EditProperty;
