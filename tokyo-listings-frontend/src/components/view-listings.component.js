import React from 'react';
import { View } from "react-native";
import { ListGroup, Form, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import PropertyDataService from "../services/property.service";
import { removeNullProps, formatAddress, scrollMagic } from "../utils/util";
import "../styles/scrollbar.css";
import equal from 'fast-deep-equal';

const cloneDeep = require('clone-deep');

class ViewListings extends React.Component {
  constructor(props) {
    super();
    this.inputAddress = this.inputAddress.bind(this);
    this.setParams = this.setParams.bind(this);
    this.getProperties = this.getProperties.bind(this);
    this.setProperties = props.setProperties.bind(this);
    this.selectProperty = props.selectProperty.bind(this);
    this.clickProperty = this.clickProperty.bind(this);
    this.scrollToSelected = this.scrollToSelected.bind(this);
    this.getUpdatedProperty = this.getUpdatedProperty.bind(this);
    this.closePropertyInfo = props.closePropertyInfo.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.scroll = this.scroll.bind(this);
    this.scrollRef = React.createRef();

    this.state = {
      search_params: {
        property_type: "",
        availability: "募集中",
        interest: "Top",
        prefecture: "",
        municipality: "",
        town: "",
        district: "",
        block: ""
      },
      properties: [],
      previousSearchParams: null,
      selectedPropertyID: props.selectedPropertyID !== -1 ? props.selectedPropertyID : -1,
      window_height: window.innerHeight,
      list_item_height: 76,
      non_list_height: 380
    }
  }

  inputAddress(e) {
    let x = this.state.search_params;
    x[e.target.name] = e.target.value;
    this.setState({ search_params: x });
  }

  setParams(e, param) {
    if (typeof e.target.value !== "undefined") {
      let x = this.state.search_params;
      if (x[param] !== e.target.value) {
        x[param] = e.target.value;
      } else {
        x[param] = "";
        e.preventDefault();
      }
      this.setState({ search_params: x });
    }
  }

  getProperties() {
    const search_params = removeNullProps(cloneDeep(this.state.search_params));
    delete search_params.availability;
    let query = "?";

    for (const [key, value] of Object.entries(search_params)) {
      query += key + "=" + value + "&";
    }

    PropertyDataService.getWithChildren(query)
      .then(response => {
        if (response.data.length > 0) {
          let tempProperties = response.data;

          if (this.state.search_params.availability !== "") {
            if (this.state.search_params.availability === "募集中") {
              tempProperties = tempProperties.filter(property => property.listings.filter(listing => listing.availability === "募集中").length > 0);
            } else if (this.state.search_params.availability === "契約済") {
              tempProperties = tempProperties.filter(property => property.listings.every(listing => listing.availability === "契約済"));
            }
          }

          this.setState({ properties: tempProperties }, this.setProperties(tempProperties));

          if (this.state.selectedPropertyID !== -1) {
            if (tempProperties.filter(p => p.id.toString() === this.state.selectedPropertyID.toString()).length < 1) {
              this.closePropertyInfo();
              this.scrollRef.current.scrollTo(0, 0);
            } else {
              this.scrollToSelected(this.state.selectedPropertyID);
            }
          } else {
            this.scrollRef.current.scrollTo(0, 0);
          }
        } else {
          this.setState({ properties: [] });
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  getUpdatedProperty(propID) {
    PropertyDataService.getWithChildren("?id=" + propID)
      .then(response => {
        console.log(response.data);
        if (response.data.length > 0) {
          let tempProperties = this.state.properties.map(p => p.id === propID ? response.data[0] : p);
          this.setState({ properties: tempProperties }, this.setProperties(tempProperties));
        } else {
          let tempProperties = this.state.properties.filter(p => p.id !== propID);
          this.setState({ properties: tempProperties }, this.setProperties(tempProperties));
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  clickProperty(p) {
    this.setState({selectedPropertyID: p.id}, () => this.selectProperty(p));
  }

  componentDidUpdate(prevProps) {
    if (!equal(this.state.search_params, this.state.previousSearchParams)) {
      this.setState({ previousSearchParams: cloneDeep(this.state.search_params) });
      this.getProperties();
    }
    if (this.props.update !== prevProps.update) {
      console.log("update in ViewListings");
      this.getUpdatedProperty(this.state.selectedPropertyID);
    }
    if (this.props.selectedPropertyID !== this.state.selectedPropertyID && this.props.selectedPropertyID !== prevProps.selectedPropertyID) {
      this.setState({selectedPropertyID: this.props.selectedPropertyID});
      if (this.props.selectedPropertyID !== -1) {
        this.scrollToSelected(this.props.selectedPropertyID);
      }
    }
  }

  scrollToSelected(propertyID) {
    let index;
    let offset = Math.round(~~((this.state.window_height-this.state.non_list_height)/this.state.list_item_height)/2)-1;

    for (var i = 0; i < this.state.properties.length; i += 1) {
      if (this.state.properties[i]["id"] === propertyID) {
        index = i;
        break;
      }
    }

    const amountToScroll = this.state.list_item_height * (index - offset);
    this.scrollRef.current.scrollTo(0, amountToScroll);
  }

  handleResize(event) {
    this.setState({window_height: window.innerHeight});
  }

  scroll(e) {
    e.preventDefault();

    if (e.deltaY < 0) {
      this.scrollRef.current.scrollTo(0, this.scrollRef.current.scrollTop - this.state.list_item_height);
    } else if (e.deltaY > 0) {
      this.scrollRef.current.scrollTo(0, this.scrollRef.current.scrollTop + this.state.list_item_height);
    }
  }

  componentDidMount() {
    document.title = 'TKL View';
    this.getProperties();
    window.addEventListener("resize", this.handleResize);
    this.scrollRef.current.addEventListener('wheel', this.scroll, { passive: false });
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18}}>Property Search</h4>
        <View style={{flexDirection: "row", paddingTop: 25}}>
          <View style={{flex: 1, paddingRight: 10}}>
            <ToggleButtonGroup name="property_type" type="radio" onClick={(e) => this.setParams(e, "property_type")} value={this.state.search_params.property_type}>
              <ToggleButton className="selected" value="一戸建て" variant="dark">一戸建て</ToggleButton>
              <ToggleButton className="selected" value="アパート" variant="dark">アパート</ToggleButton>
            </ToggleButtonGroup>
          </View>
          <View style={{flex: 1}}>
            <ToggleButtonGroup name="availability" type="radio" onClick={(e) => this.setParams(e, "availability")} value={this.state.search_params.availability}>
              <ToggleButton className="selected" value="募集中" variant="dark">募集中</ToggleButton>
              <ToggleButton className="selected" value="契約済" variant="dark">契約済</ToggleButton>
            </ToggleButtonGroup>
          </View>
        </View>
        <View style={{flexDirection: "row", paddingTop: 15}}>
          <View style={{flex: 1}}>
            <ToggleButtonGroup name="interest" type="radio" onClick={(e) => this.setParams(e, "interest")} value={this.state.search_params.interest}>
              <ToggleButton className="selected" value="Top" variant="dark">Top</ToggleButton>
              <ToggleButton className="selected" value="Extremely" variant="dark">Extremely</ToggleButton>
              <ToggleButton className="selected" value="KindaPlus" variant="dark">Kinda+</ToggleButton>
              <ToggleButton className="selected" value="KindaMinus" variant="dark">Kinda-</ToggleButton>
              <ToggleButton className="selected" value="Nah" variant="dark">Nah</ToggleButton>
            </ToggleButtonGroup>
          </View>
        </View>
        <Form autoComplete="a">
          <View style={{flexDirection: "row", paddingTop: 15}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Prefecture</Form.Label>
                <Form.Control autoComplete="off" name="prefecture" value={this.state.search_params.prefecture} onChange={this.inputAddress} placeholder="都 / 県"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control autoComplete="off" name="municipality" value={this.state.search_params.municipality} onChange={this.inputAddress} placeholder="市 / 区"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>Town</Form.Label>
                <Form.Control autoComplete="off" name="town" value={this.state.search_params.town} onChange={this.inputAddress} placeholder="町"/>
              </Form.Group>
            </View>
            <View style={{flex: 1, paddingRight: 10}}>
              <Form.Group>
                <Form.Label>District</Form.Label>
                <Form.Control autoComplete="off" name="district" value={this.state.search_params.district} onChange={this.inputAddress} placeholder="丁目"/>
              </Form.Group>
            </View>
            <View style={{flex: 1}}>
              <Form.Group>
                <Form.Label>Block</Form.Label>
                <Form.Control autoComplete="off" name="block" value={this.state.search_params.block} onChange={this.inputAddress} placeholder="番"/>
              </Form.Group>
            </View>
          </View>
        </Form>
        <div style={{paddingTop: 10}}>
          <ListGroup ref={this.scrollRef} className="scrollbar" style={{height: scrollMagic(this.state.window_height, this.state.list_item_height, this.state.non_list_height)}}>
            {this.state.properties.map(p =>
              <ListGroup.Item className="listingItem" active={p.id === this.state.selectedPropertyID} action onClick={() => this.clickProperty(p)} key={p.id}>
                <div style={{height: this.state.list_item_height-25}}>
                  <h5>{formatAddress(p) + "の" + p.property_type}</h5>
                  <small style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%"}}>
                    <span style={{ whiteSpace: "nowrap"}}>
                      賃料: <b>{p.listings[0].monthly_rent}万円</b> &nbsp;/&nbsp;
                      面積: <b>{p.listings[0].square_m}m²</b> &nbsp;/&nbsp;
                      礼金: <b>{p.listings[0].reikin}ヶ月</b> &nbsp;/&nbsp;
                      敷金: <b>{p.listings[0].security_deposit}ヶ月</b> &nbsp;/&nbsp;
                      {p.listings[0].closest_station} <b>
                      徒歩{p.listings[0].walking_time}分</b>
                    </span>
                  </small>
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        </div>
      </div>
    );
  }
}

export default ViewListings;
