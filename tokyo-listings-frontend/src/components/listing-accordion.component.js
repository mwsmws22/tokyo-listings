import React, { Component, useContext } from "react";
import { Accordion, Card, Badge, AccordionContext, Table, useAccordionToggle } from "react-bootstrap";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { formatAddress, scrollMagic } from "../utils/util";
import equal from 'fast-deep-equal';
import "../styles/scrollbar.css";

const moment = require('moment');

function CustomToggle({ children, eventKey, updateCallback, onClickCallback, selected, height }) {
  const currentEventKey = useContext(AccordionContext);
  const decoratedOnClick = useAccordionToggle(eventKey);
  const isCurrentEventKey = currentEventKey === eventKey;
  const createdAt = moment(new Date(children[1].createdAt)).format('h:mm a');

  const selectListing = () => {
    updateCallback(eventKey, children[1].property_id);
  }

  return (
    <Card.Header style={{cursor: "pointer", height: height}}>
      <div className="row">
        <div className="col-md" onClick={() => {decoratedOnClick(); onClickCallback();}}>
          <div className="row">
            <div style={{paddingLeft: 20, position: "absolute", bottom: 2}}>{isCurrentEventKey ? <FaChevronDown /> : <FaChevronUp />}</div>
            <div style={{paddingLeft: 45}}>{children[0]}</div>
          </div>
        </div>
        { children[2] === "previous"
        ? <div className="text-right" style={{paddingRight: 20}}>{createdAt}</div>
        : <div className="text-right" style={{paddingRight: 20}} onClick={selectListing}>
            <Badge pill variant={ selected ? "success" : "dark"} style={{fontSize: "0.8rem", paddingBottom: "5px"}}> Same </Badge>
          </div>
        }
      </div>
    </Card.Header>
  );
}

export class ListingAccordion extends Component {
  constructor(props) {
    super(props);
    this.updateSelected = this.updateSelected.bind(this);
    this.updateHeight = this.updateHeight.bind(this);
    this.selectExistingProperty = props.selectExistingProperty && props.selectExistingProperty.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.scroll = this.scroll.bind(this);
    this.scrollRef = React.createRef();

    this.state = {
      listings: props.listings,
      mode: props.mode,
      selected: -1,
      clicked_id: -1,
      list_full_height: scrollMagic(window.innerHeight, props.list_item_height, props.non_list_height),
      list_item_height: props.list_item_height,
      non_list_height: props.non_list_height,
      rough_list_height: props.list_item_height * props.listings.length
    };
  }

  componentDidUpdate(prevProps) {
    if (!equal(this.props.listings, prevProps.listings)) {
      this.setState({listings: this.props.listings});
    }
  }

  updateSelected(id, property_id) {
    if (id === this.state.selected) {
      this.setState({selected: -1});
      this.selectExistingProperty(-1);
    } else {
      this.setState({selected: id});
      this.selectExistingProperty(property_id);
    }
  }

  updateHeight(id) {
    let inc = 300;
    let clicked_id = id;

    if (this.state.clicked_id !== -1) {
      if (id !== this.state.clicked_id) {
        inc = 0;
      } else {
        clicked_id = -1;
        inc *= -1;
      }
    }

    let roughHeightTemp = this.state.rough_list_height + inc;
    this.setState({rough_list_height: roughHeightTemp, clicked_id: clicked_id});
  }

  handleResize(event) {
    this.setState({list_full_height: scrollMagic(window.innerHeight, this.state.list_item_height, this.state.non_list_height)});
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

  render() {
    return (
      <div>
        <Accordion ref={this.scrollRef} className="scrollbar" style={{height: this.state.rough_list_height < this.state.list_full_height ? '100%' : this.state.list_full_height}}>
          {this.state.listings.map(l =>
            <Card key={l.listing.id}>
              <CustomToggle updateCallback={this.updateSelected}
                            height={this.state.list_item_height}
                            onClickCallback={() => this.updateHeight(l.listing.id)}
                            eventKey={l.listing.id}
                            selected={this.state.selected === l.listing.id}>
                {[formatAddress(l.property) + "の"　+ l.property.property_type, l.listing, this.state.mode]}
              </CustomToggle>
              <Accordion.Collapse eventKey={l.listing.id}>
                <Card.Body>
                  <Table bordered style={{marginBottom: 0, tableLayout: "fixed", width: "100%"}}>
                    <tbody>
                      <tr>
                        <td className="bg-light">URL</td>
                        <td colSpan="3">
                          <a href={l.listing.url} style={{display: "block", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%"}}>
                            <span style={{ whiteSpace: "nowrap"}}>{ l.listing.url }</span>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-light">Monthly Rent</td>
                        <td>{ l.listing.monthly_rent ? l.listing.monthly_rent + "万円" : "N/A" }</td>
                        <td className="bg-light">礼金</td>
                        <td>{ l.listing.reikin !== null ? (l.listing.reikin !== 0 ? l.listing.reikin + "ヶ月" : l.listing.reikin) : "N/A" }</td>
                      </tr>
                      <tr>
                        <td className="bg-light">敷金</td>
                        <td>{ l.listing.security_deposit !== null ? (l.listing.security_deposit !== 0 ? l.listing.security_deposit + "ヶ月" : l.listing.security_deposit) : "N/A" }</td>
                        <td className="bg-light">面積</td>
                        <td>{ l.listing.square_m ? l.listing.square_m + "m²" : "N/A" }</td>
                      </tr>
                      <tr>
                        <td className="bg-light">Closest Station</td>
                        <td>{ l.listing.closest_station ? l.listing.closest_station : "N/A" }</td>
                        <td className="bg-light">Walking Time</td>
                        <td>{ l.listing.walking_time ? l.listing.walking_time + "分" : "N/A" }</td>
                      </tr>
                      <tr>
                        <td className="bg-light">Availability</td>
                        <td>{ l.listing.availability ? l.listing.availability : "N/A" }</td>
                        <td className="bg-light">Interest</td>
                        <td>{ l.property.interest ? l.property.interest : "N/A" }</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          )}
        </Accordion>
      </div>
    );
  }
}
