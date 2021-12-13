import React from 'react';
import { Button, Form, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { View } from "react-native";
import RankingDataService from "../services/ranking.service";
import { removeNullProps } from "../utils/util";
import equal from 'fast-deep-equal';

const cloneDeep = require('clone-deep');

class RankProperty extends React.Component {
  constructor(props) {
    super();
    this.handleInput = this.handleInput.bind(this);
    this.updateRanking = this.updateRanking.bind(this);
    this.createRanking = this.createRanking.bind(this);
    this.deleteRanking = this.deleteRanking.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.setRanking = this.setRanking.bind(this);
    this.updateOnEdit = props.updateOnEdit.bind(this);
    this.calcTextBoxHeight = this.calcTextBoxHeight.bind(this);

    this.state = {
      property: props.property,
      text_box_height: this.calcTextBoxHeight()
    }
  }

  handleResize(event) {
    this.setState({text_box_height: this.calcTextBoxHeight()});
  }

  handleInput(e, obj) {
    let x = this.state.property;
    x["ranking"][e.target.name] = e.target.value;
    this.setState({ property: x });
  }

  setRanking(obj) {
    let x = this.state.property;
    x["ranking"] = obj;
    this.setState({ property: x });
  }

  componentDidUpdate(prevProps) {
    console.log(this.state.property);
    if (!equal(this.props.property, prevProps.property)) {
        this.setState({ property: this.props.property });
    }
  }

  createRanking() {
    let tempRanking = {
      property_id: this.state.property.id,
      status: "Possible"
    }

    RankingDataService.getWithQuery("?property_id="+this.state.property.id)
      .then(response => {
        if (response.data.length === 0 && this.state.property.ranking === null) {
          RankingDataService.create(tempRanking)
            .then(response => {
              this.updateOnEdit("create ranking");
            })
            .catch(e => {
              console.log(e);
          });
        }
      })
      .catch(e => {
        console.log(e);
    });
  }

  updateRanking() {
    RankingDataService.update(this.state.property.ranking.id, removeNullProps(cloneDeep(this.state.property.ranking)))
      .catch(e => {
        console.log(e);
    });
  }

  calcTextBoxHeight(){
    let tempHeight = (window.innerHeight - 500) / 2;
    if (tempHeight < 85) {
      return 85;
    } else {
      return tempHeight;
    }
  }

  deleteRanking() {
    console.log("delete");
    RankingDataService.remove(this.state.property.ranking.id)
      .then(response => {
        console.log("response");
        this.updateOnEdit("delete ranking");
      })
      .catch(e => {
        console.log(e);
    });
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }

  render() {
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
      <h4 className="text-center mb-0" style={{paddingTop: 18}}>Ranking</h4>
        { this.state.property.ranking == null
          ? <div className="text-center" style={{paddingTop: 20}}>
              <Button bg="dark" onClick={this.createRanking} variant="dark">Create Ranking</Button>
            </div>
          : <Form autoComplete="off" style={{paddingBottom: 8, paddingTop: 12}}>
              <View style={{flexDirection: "row"}}>
                <View style={{flex: 1, paddingRight: 10}}>
                  <Form.Group>
                    <Form.Label>Rank</Form.Label>
                    <Form.Control name="rank" value={this.state.property.ranking.rank} onChange={(e) => this.handleInput(e)}/>
                  </Form.Group>
                </View>
                <View style={{flex: 2}}>
                  <Form.Group>
                    <Form.Label style={{display:"block"}}>Status</Form.Label>
                    <ToggleButtonGroup style={{width: '100%'}} name="status" type="radio" onClick={(e) => this.handleInput(e)} value={this.state.property.ranking.status}>
                      <ToggleButton className="selected" value="Possible" variant="dark">Possible</ToggleButton>
                      <ToggleButton className="selected" value="Ruled out" variant="dark">Ruled out</ToggleButton>
                    </ToggleButtonGroup>
                  </Form.Group>
                </View>
              </View>
              <View>
                <Form.Group>
                  <Form.Label>General Notes</Form.Label>
                  <Form.Control style={{ height: this.state.text_box_height, resize: "none" }} as="textarea" name="general_notes" value={this.state.property.ranking.general_notes} onChange={(e) => this.handleInput(e)}/>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Inquiry Notes</Form.Label>
                  <Form.Control style={{ height: this.state.text_box_height, resize: "none" }} as="textarea" name="inquiry_notes" value={this.state.property.ranking.inquiry_notes} onChange={(e) => this.handleInput(e)}/>
                </Form.Group>
              </View>
              <div className="text-center" style={{paddingTop: 5}}>
                <Button onClick={this.updateRanking} bg="dark" variant="dark">Update</Button>
              </div>
              <div><hr/></div>
              <div className="text-center" style={{paddingTop: 5}}>
                <Button bg="dark" onClick={this.deleteRanking} variant="danger">Delete Ranking</Button>
              </div>
            </Form>
        }
      </div>
    );
  }
}

export default RankProperty;
