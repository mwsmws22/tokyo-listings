import React from 'react';
import { ListGroup, ProgressBar, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { View } from "react-native";
import PropertyDataService from "../services/property.service";
import OneOffService from "../services/oneoff.service";
import "../styles/scrollbar.css";
import { sleep, scrollMagic } from "../utils/util";

class SuumoSearcher extends React.Component {
  constructor(props) {
    super();
    this.getProperties = this.getProperties.bind(this);
    this.searchSuumoForProperties = this.searchSuumoForProperties.bind(this);
    this.selectProperty = this.selectProperty.bind(this);
    this.setInterest = this.setInterest.bind(this);
    this.setProperty = props.setProperty.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.sortSimilarListings = this.sortSimilarListings.bind(this);
    this.scroll = this.scroll.bind(this);
    this.scrollRef = React.createRef();

    this.state = {
      similarListings: [],
      selectedListing: null,
      checkCount: 0,
      totalCheckCount: 0,
      interest: "",
      window_height : window.innerHeight,
      list_item_height : 50
    }
  }

  getProperties() {
    if (this.state.interest !== "") {
      PropertyDataService.getWithQuery(`?interest=${this.state.interest}`)
        .then(response => this.searchSuumoForProperties(response.data))
        .catch(e => console.log(e))
    }
  }

  async searchSuumoForProperties(properties) {
    this.setState({totalCheckCount: properties.length});

    for (var i = 0; i < properties.length; i++) {
      const propId = properties[i].id
      await sleep(1000)
      await OneOffService.searchSuumo(propId)
        .then(res => {
          if (res.data) {
            console.log(`Listing(s) found for Property ${propId}`)
            this.setState({
              checkCount: this.state.checkCount + 1,
              similarListings: this.sortSimilarListings(res.data)
            })
          } else {
            console.log(`Listing(s) NOT found for Property ${propId}`)
            this.setState({ checkCount: this.state.checkCount + 1 })
          }
        })
        .catch(err => console.log(err))
    }
  }

  sortSimilarListings(listing) {
    const addPropToEachListing = listing.similarListings.map(l => ({listing:l, property:listing.property}))
    const listings = [...this.state.similarListings, ...addPropToEachListing]
    listings.sort((a,b) => a.property.id < b.property.id ? -1 : 1 )
    return listings
  }

  selectProperty(l) {
    this.setState({ selectedListing: l }, this.setProperty(l.property));
  }

  handleResize(event) {
    this.setState({window_height: window.innerHeight});
  }

  setInterest(e) {
    if (typeof e.target.value !== "undefined") {
      if (this.state.interest !== e.target.value) {
        this.setState({
          interest: e.target.value,
          similarListings: [],
          checkCount: 0,
          totalCheckCount: 0,
          selectedListing: null
        }, this.getProperties);
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
    document.title = 'TKL Suumo Searcher';
    window.addEventListener("resize", this.handleResize);
    this.scrollRef.current.addEventListener('wheel', this.scroll, { passive: false });
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18, paddingBottom: 22}}>Search for Listings on Suumo</h4>
        <View style={{flexDirection: "row", paddingBottom: 10, paddingRight: 6, paddingLeft:1}}>
          <View style={{flex: 1}}>
            <ToggleButtonGroup name="interest" type="radio" onClick={(e) => this.setInterest(e)} value={this.state.interest}>
              <ToggleButton className="selected" value="Top" variant="dark">Top</ToggleButton>
              <ToggleButton className="selected" value="Extremely" variant="dark">Extremely</ToggleButton>
              <ToggleButton className="selected" value="KindaPlus" variant="dark">Kinda+</ToggleButton>
              <ToggleButton className="selected" value="KindaMinus" variant="dark">Kinda-</ToggleButton>
              <ToggleButton className="selected" value="Nah" variant="dark">Nah</ToggleButton>
            </ToggleButtonGroup>
          </View>
        </View>
        <div style={{paddingTop: 8, paddingBottom: 12, paddingLeft:1, paddingRight: 6}}>
          <ProgressBar variant="dark" now={this.state.checkCount/this.state.totalCheckCount*100}/>
        </div>
        <div style={{paddingTop: 15}}>
          <ListGroup ref={this.scrollRef} className="scrollbar" style={{height: scrollMagic(this.state.window_height, this.state.list_item_height, 260)}}>
            {this.state.similarListings.map(l =>
              <ListGroup.Item
                key={l.listing.url}
                onClick={() => this.selectProperty(l)}
                variant={l.listing.url === this.state.selectedListing?.listing.url && "dark"}>
                <div className="row justify-content-between" style={{height: this.state.list_item_height-25}}>
                  <div className="col-9">
                    <a
                      href={l.listing.url}
                      target="_blank"
                      rel="noreferrer"
                      color={ this.state.selectedListing?.property.id === l.property.id ? "red" : undefined }
                      style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%"}}>
                      <span style={{ whiteSpace: "nowrap" }}>{ l.listing.url }</span>
                    </a>
                  </div>
                </div>
              </ListGroup.Item>
            )}
          </ListGroup>
        </div>
      </div>
    );
  }
}

export default SuumoSearcher;
