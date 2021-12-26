import React from 'react';
import { Table, ListGroup, Badge } from "react-bootstrap";
import { formatAddress, scrollMagic } from "../utils/util";
import equal from 'fast-deep-equal';
import "../styles/scrollbar.css";

class PropertyInfo extends React.Component {
  constructor(props) {
    super();
    this.setSelectedListingID = props.setSelectedListingID.bind(this);
    this.setEditListing = this.setEditListing.bind(this);
    this.handleResize = this.handleResize.bind(this);
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
            <ListGroup.Item key={l.id} variant={l.availability === "契約済" && "danger"}>
              <div className="row justify-content-between" style={{height: this.state.list_item_height-25}}>
                <div className="col-9">
                  <a href={l.url} target="_blank" style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%"}}>
                    <span style={{ whiteSpace: "nowrap"}}>{ l.url }</span>
                  </a>
                </div>
                <div className="text-right" style={{paddingRight: 20}} onClick={() => this.setEditListing(l)}>
                  <Badge pill variant={ this.state.edit_listing.id === l.id ? "success" : "dark"} style={{fontSize: "0.8rem", paddingBottom: "4px", cursor:"pointer"}}> Selected </Badge>
                </div>
              </div>
            </ListGroup.Item>
          )}
        </ListGroup>
      </div>
    );
  }
}

export default PropertyInfo;
