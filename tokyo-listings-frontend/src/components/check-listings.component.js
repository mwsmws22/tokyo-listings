import React from 'react';
import { ListGroup, Badge, ProgressBar, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { View } from "react-native";
import ListingDataService from "../services/listing.service";
import PropertyDataService from "../services/property.service";
import ScrapingService from "../services/scraping.service";
import "../styles/scrollbar.css";
import { sleep, scrollMagic } from "../utils/util";

class CheckListings extends React.Component {
  constructor(props) {
    super();
    this.getListings = this.getListings.bind(this);
    this.checkURLs = this.checkURLs.bind(this);
    this.scrapeCheck = this.scrapeCheck.bind(this);
    this.setListingToUnavailable = this.setListingToUnavailable.bind(this);
    this.selectProperty = this.selectProperty.bind(this);
    this.setInterest = this.setInterest.bind(this);
    this.setProperty = props.setProperty.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.sortListings = this.sortListings.bind(this);
    this.scroll = this.scroll.bind(this);
    this.scrollRef = React.createRef();

    this.state = {
      listings: [],
      selectedProperty: null,
      selectedListingID: -1,
      checkCount: 0,
      totalCheckCount: 0,
      interest: "",
      window_height : window.innerHeight,
      list_item_height : 50
    }
  }

  getListings() {
    let query = "?availability=募集中";

    if (this.state.interest !== "") {
      ListingDataService.getByInterest(this.state.interest, query)
        .then(response => {
          this.checkURLs(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
  }

  checkURLs(listings) {
    let urlTimings = {
      'realestate.yahoo.co.jp': 7000
    }

    this.setState({totalCheckCount: listings.length});

    let otherListings = listings;

    for (const [url, time] of Object.entries(urlTimings)) {
      let urlListings = listings.filter(l => l.url.includes(url));
      otherListings = otherListings.filter(l => !l.url.includes(url));
      this.scrapeCheck(urlListings, undefined, time);
    }

    this.scrapeCheck(otherListings, undefined, 1000);
  }

  async scrapeCheck(listings, doubleCheck=false, delay=null) {
    for (var i = 0; i < listings.length; i++) {
      let l = listings[i];
      this.setState({checkCount: this.state.checkCount + 1});
      if (delay) {
        await sleep(delay);
      }
      ScrapingService.scrapeCheck(l.url)
        .catch(e => {
          if (l.url.includes('www.r-store.jp') && !doubleCheck) {
            this.scrapeCheck([l], true);
          } else {
            this.setState({ listings: this.sortListings(l) });
          }
      });
    }
  }

  sortListings(listing) {
    const listings = [...this.state.listings, listing]
    listings.sort((a,b) => a.property_id < b.property_id ? -1 : 1 )
    return listings
  }

  setListingToUnavailable(l) {
    ListingDataService.update(l.id, {availability: "契約済"})
      .then(response => {
        let listings = [...this.state.listings];
        const index = listings.indexOf(l);
        if (index !== -1) {
          listings.splice(index, 1);
          this.setState({listings: listings}, this.selectProperty(l, true));
        }
      })
      .catch(e => {
        console.log(e);
    });
  }

  selectProperty(l, remove=false) {
    const query = "?id=" + l.property_id;

    PropertyDataService.getWithChildren(query)
      .then(response => {
        if (response.data.length === 1) {
          const selectedProp = response.data[0]
          if (remove) {
            this.setProperty(selectedProp)
          } else {
            this.setState({ selectedProperty: selectedProp, selectedListingID: l.id },
              this.setProperty(selectedProp));
          }
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  handleResize(event) {
    this.setState({window_height: window.innerHeight});
  }

  setInterest(e) {
    if (typeof e.target.value !== "undefined") {
      if (this.state.interest !== e.target.value) {
        this.setState({
          interest: e.target.value,
          listings: [],
          checkCount: 0,
          totalCheckCount: 0,
          selectedProperty: null,
          selectedListingID: -1
        }, this.getListings);
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
    document.title = 'TKL Check';
    window.addEventListener("resize", this.handleResize);
    this.scrollRef.current.addEventListener('wheel', this.scroll, { passive: false });
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <h4 className="text-center mb-0" style={{paddingTop: 18, paddingBottom: 22}}>Check Listings</h4>
        <View style={{flexDirection: "row", paddingBottom: 10, paddingRight: 6, paddingLeft:1}}>
          <View style={{flex: 1}}>
            <ToggleButtonGroup name="interest" type="radio" onClick={(e) => this.setInterest(e)} value={this.state.interest}>
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
            {this.state.listings.map(l =>
              <ListGroup.Item key={l.id} onClick={() => this.selectProperty(l)} variant={l.id === this.state.selectedListingID && "dark"}>
                <div className="row justify-content-between" style={{height: this.state.list_item_height-25}}>
                  <div className="col-9">
                    <a href={l.url} target="_blank" color={ this.state.selectedProperty?.id === l.property_id ? "red" : undefined } style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%"}}>
                      <span style={{ whiteSpace: "nowrap" }}>{ l.url }</span>
                    </a>
                  </div>
                  <div className="text-right" style={{paddingRight: 20}} onClick={() => this.setListingToUnavailable(l)}>
                    <Badge pill variant="danger" style={{fontSize: "0.8rem", paddingBottom: "4px", cursor:"pointer"}}> 契約済 </Badge>
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

export default CheckListings;
