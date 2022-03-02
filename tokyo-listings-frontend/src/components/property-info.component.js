import React from 'react';
import { View } from "react-native";
import { Table, ListGroup } from "react-bootstrap";
import { FaImages } from "react-icons/fa";
import { formatAddress, scrollMagic } from "../utils/util";
import equal from 'fast-deep-equal';
import "../styles/scrollbar.css";

const cloneDeep = require('clone-deep');
const selectedBorder = "1px solid #01ff1f"
const unselectedBorder = "1px solid white"

const unselectedStyle = {
  borderBottom: "none"
}

const selectedStyle = {
  borderLeft: selectedBorder,
  borderTop: selectedBorder,
  borderBottom: "none"
}

const imageStyle = {
  fontSize: "20px",
  backgroundColor:"#000033",
  height: "100%",
  color: "white",
  textAlign: "center",
  paddingTop: "7px",
  cursor: "pointer"
}

const unselectedImagesStyle = {
  ...imageStyle,
  borderTop: unselectedBorder,
  borderRight: unselectedBorder,
  borderBottom: "none",
  borderLeft: "none"
}

const selectedImagesStyle = {
  ...imageStyle,
  borderTop: selectedBorder,
  borderRight: selectedBorder,
  borderBottom: "none",
  borderLeft: "none"
}

class PropertyInfo extends React.Component {
  constructor(props) {
    super();
    this.setSelectedListingID = props.setSelectedListingID.bind(this);
    this.setEditListing = this.setEditListing.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.getListItemStyle = this.getListItemStyle.bind(this);
    this.getImageIconStyle = this.getImageIconStyle.bind(this);
    this.dealWithBorders = this.dealWithBorders.bind(this);
    this.getImages = this.getImages.bind(this);
    this.scroll = this.scroll.bind(this);
    this.scrollRef = React.createRef();

    this.state = {
      property: props.property,
      edit_listing: props.listingId ?  props.property.listings.filter(l => l.id === props.listingId)[0] : props.property.listings[0],
      window_height : window.innerHeight,
      list_item_height : 50
    }

    this.setSelectedListingID(this.state.edit_listing.id);
  }

  handleResize(event) {
    this.setState({window_height: window.innerHeight});
  }

  componentDidUpdate(prevProps) {
    if (this.props.property) {
      if (!equal(this.props.property, prevProps.property)) {
        this.setState({
          property: this.props.property,
          edit_listing: this.props.listingId ?  this.props.property.listings.filter(l => l.id === this.props.listingId)[0] : this.props.property.listings[0]
        });
      }
    }
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
    window.addEventListener("resize", this.handleResize);
    this.scrollRef.current.addEventListener('wheel', this.scroll, { passive: false });
  }

  setEditListing(l) {
    this.setSelectedListingID(l.id);
    this.setState({edit_listing: l});
  }

  dealWithBorders(style, id) {
    const lastIdx = this.state.property.listings.length - 1
    const selectedIdx = this.state.property.listings.findIndex(l => l.id === this.state.edit_listing.id)

    if (id === this.state.property.listings[lastIdx].id) {
      style.borderBottom = unselectedBorder
    }

    if (selectedIdx !== lastIdx) {
      if (this.state.property.listings[selectedIdx + 1].id === id) {
        style.borderTop = selectedBorder
      }
    } else if (this.state.edit_listing.id === id) {
      style.borderBottom = selectedBorder
    }

    return style
  }

  getListItemStyle(id) {
    let style = this.state.edit_listing.id === id ? cloneDeep(selectedStyle) : cloneDeep(unselectedStyle)
    return this.dealWithBorders(style, id)
  }

  getImageIconStyle(id) {
    let style = this.state.edit_listing.id === id ? cloneDeep(selectedImagesStyle) : cloneDeep(unselectedImagesStyle)
    return this.dealWithBorders(style, id)
  }

  getImages(l) {
    window.open('images/' + l.id, "_blank")
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10, height:"100%", overflow : "hidden" }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18, paddingBottom: 18}}>Basic Info</h4>
        <Table bordered style={{marginBottom: 0, tableLayout: "fixed", width: "100%"}}>
          <tbody>
            <tr>
              <td className="bg-light">Monthly Rent</td>
              <td>{ this.state.edit_listing.monthly_rent ? this.state.edit_listing.monthly_rent + "万円" : "N/A" }</td>
              <td className="bg-light">礼金</td>
              <td>{ this.state.edit_listing.reikin !== null ? (this.state.edit_listing.reikin !== 0 ? this.state.edit_listing.reikin + "ヶ月" : this.state.edit_listing.reikin) : "N/A" }</td>
            </tr>
            <tr>
              <td className="bg-light">敷金</td>
              <td>{ this.state.edit_listing.security_deposit !== null ? (this.state.edit_listing.security_deposit !== 0 ? this.state.edit_listing.security_deposit + "ヶ月" : this.state.edit_listing.security_deposit) : "N/A" }</td>
              <td className="bg-light">面積</td>
              <td>{ this.state.edit_listing.square_m ? this.state.edit_listing.square_m + "m²" : "N/A" }</td>
            </tr>
            <tr>
              <td className="bg-light">Closest Station</td>
              <td>{ this.state.edit_listing.closest_station ? this.state.edit_listing.closest_station : "N/A" }</td>
              <td className="bg-light">Walking Time</td>
              <td>{ this.state.edit_listing.walking_time ? this.state.edit_listing.walking_time + "分" : "N/A" }</td>
            </tr>
            <tr>
              <td className="bg-light">Availability</td>
              <td>{ this.state.edit_listing.availability ? this.state.edit_listing.availability : "N/A" }</td>
              <td className="bg-light">Interest</td>
              <td>{ this.state.property.interest ? this.state.property.interest : "N/A" }</td>
            </tr>
            <tr>
              <td className="bg-light">Address</td>
              <td colSpan="3">{formatAddress(this.state.property)}</td>
            </tr>
          </tbody>
        </Table>
        <h4 className="text-center mb-0" style={{paddingTop: 18, paddingBottom: 18}}>Listings</h4>
        <ListGroup ref={this.scrollRef} className="scrollbar" style={{height: scrollMagic(this.state.window_height, this.state.list_item_height, 488)}}>
          {this.state.property.listings.map(l =>
            <View style={{flexDirection: "row"}}>
              <View style={{flex: 9}}>
                <ListGroup.Item
                  key={l.id}
                  variant={l.availability === "契約済" && "danger"}
                  style={this.getListItemStyle(l.id)}
                  onClick={() => this.setEditListing(l)}>
                  <div onClick={() => this.setEditListing(l)} style={{height: this.state.list_item_height-25}}>
                    <a href={l.url} target="_blank" style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "90%"}}>
                      <span style={{ whiteSpace: "nowrap"}}>{ l.url }</span>
                    </a>
                  </div>
                </ListGroup.Item>
              </View>
              <View style={{flex: 1}}>
                <div style={this.getImageIconStyle(l.id)} onClick={() => this.getImages(l)}>
                  <FaImages />
                </div>
              </View>
            </View>
          )}
        </ListGroup>
      </div>
    );
  }
}

export default PropertyInfo;
