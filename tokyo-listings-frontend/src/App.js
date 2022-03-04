import { React, useState, useRef, useCallback } from "react";
import { View } from "react-native";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { Link, Routes, Route } from "react-router-dom";
import { Navbar, Nav } from 'react-bootstrap';
import AddListing from "./components/add-listing.component";
import ViewListings from "./components/view-listings.component";
import CheckListings from "./components/check-listings.component";
import PropertyInfo from "./components/property-info.component";
import EditProperty from "./components/edit-property.component";
import DoubleCheckListings from "./components/double-check-listings.component";
import { FaTimes } from "react-icons/fa";
import './App.css';

const libraries = ["places"];
const options = {
  center: {
    lat: 35.68114283581233,
    lng: 139.76652796705844
  },
  fullscreenControl: false,
  zoom: 12,
  mapTypeId: 'hybrid'
};

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const windowOnLoad = window.location.href.toString().split(window.location.host)[1].replace("/", "")

  const [properties, setProperties] = useState( [] );
  const [selectedListingID, setSelectedListingID] = useState(null);
  const [clickLatLng, setClickLatLng] = useState(null);
  const [addLatLng, setAddLatLng] = useState(null);
  const [selectedPropertyID, setSelectedPropertyID] = useState(-1);
  const [tab, setTab] = useState(windowOnLoad);
  const [state, setState] = useState("");
  const [updatePropertyInfo, setUpdatePropertyInfo] = useState(true);

  const mapRef = useRef();
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = (e) => {
    if (state === "editInfo") {
      setClickLatLng({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    } else if (addLatLng) {
      setAddLatLng({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }

  const panTo = useCallback((property) => {
    if (property.exact) {
      mapRef.current.setZoom(20);
    } else {
      mapRef.current.setZoom(18);
    }
    mapRef.current.panTo({ lat: property.lat, lng: property.lng });
  }, []);

  const selectProperty = (p) => {
    setSelectedListingID(null);
    setSelectedPropertyID(p.id);
    setClickLatLng(null);
    setState("viewInfo");
    panTo(p);
  }

  const setProperty = (p) => {
    setProperties([p]);
    selectProperty(p);
  }

  const closePropertyInfo = () => {
    setSelectedPropertyID(-1);
  }

  const returnToCenter = () => {
    mapRef.current.panTo(options.center);
    mapRef.current.setZoom(options.zoom);
  }

  const updateOnEdit = (mode) => {
    // issue is that when "delete" is hit, propertyInfo isn't updated
    setUpdatePropertyInfo(!updatePropertyInfo);
    switch (mode) {
      case "update info":
        setState("viewInfo");
        setClickLatLng(null);
        break;
      case "delete listing":
        setState("viewInfo");
        setClickLatLng(null);
        setSelectedListingID(null);
        break;
      case "delete property":
        closePropertyInfo();
        break;
      default:
        break;
    }
  }

  const goToPropInfo = () => {
    setState("viewInfo");
    setClickLatLng(null);
  }

  const setLatLng = (coor) => {
    if (coor) {
      setAddLatLng(coor);
      panTo(coor);
      mapRef.current.setTilt(0);
    } else {
      setAddLatLng(null);
      returnToCenter();
    }
  }

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
    <div>
      <View style={{flexDirection: "row", marginHorizontal: 15, marginVertical: 15, height: "calc(100vh - 30px)"}}>
        <View style={{flex: "0 0 600px"}}>
          <View style={{paddingRight: 15}}>
            <Navbar bg="dark" variant="dark">
              <Navbar.Brand style={{ cursor: "default", paddingRight: 20, paddingLeft: 5 }}>Tokyo Listings</Navbar.Brand>
              <hr class="vertical"/>
              <Nav className="m-auto">
                <Nav.Link active={tab === ""}       onClick={() => setTab("")}       as={Link} to="/"      style={{paddingRight: 30}}>View</Nav.Link>
                <Nav.Link active={tab === "add"}    onClick={() => setTab("add")}    as={Link} to="add"    style={{paddingRight: 30}}>Add</Nav.Link>
                <Nav.Link active={tab === "check"}  onClick={() => setTab("check")}  as={Link} to="check"  style={{paddingRight: 30}}>Check</Nav.Link>
                <Nav.Link active={tab === "double"} onClick={() => setTab("double")} as={Link} to="double">Double Check</Nav.Link>
              </Nav>
            </Navbar>
            <Routes>
              <Route index element={
                <ViewListings
                  selectedPropertyID={selectedPropertyID}
                  update={updatePropertyInfo}
                  setProperties={setProperties}
                  selectProperty={selectProperty}
                  closePropertyInfo={closePropertyInfo}
                />
              } />
              <Route path="add" element={
                <AddListing
                  latlng={addLatLng !== null ? {lat: addLatLng.lat, lng: addLatLng.lng} : ""}
                  setLatLng={setLatLng}
                />
              } />
              <Route path="check" element={<CheckListings setProperty={setProperty }/>} />
              <Route path="double" element={<DoubleCheckListings setProperty={setProperty}/>} />
            </Routes>
          </View>
        </View>
        <View style={{flex: 1}}>
          <GoogleMap id="map" mapContainerStyle={{height: "100%", width: "100%"}} options={options} onLoad={onMapLoad} onClick={onMapClick}>
            { addLatLng !== null
              ? (<Marker key={Math.random()} position={{lat: addLatLng.lat, lng: addLatLng.lng}}/>)
              : properties.map(p => {
                  if (p.id === selectedPropertyID && clickLatLng) {
                    return (<Marker key={p.id} position={clickLatLng}/>);
                  }
                  return (<Marker key={p.id} position={{lat: p.lat, lng: p.lng}} onClick={() => selectProperty(p)}/>);
                })
            }
          </GoogleMap>
        </View>
        { selectedPropertyID !== -1 &&
          (<View style={{flex: "0 0 600px", height:"100%"}}>
            <View style={{paddingLeft: 15, height:"100%"}}>
              <Navbar bg="dark" variant="dark">
                <Navbar.Brand style={{cursor:"default"}}>{"Property #" + selectedPropertyID}</Navbar.Brand>
                <Nav className="mr-auto">
                  <Nav.Link active={state === "viewInfo"} onClick={goToPropInfo}>Info</Nav.Link>
                  <Nav.Link active={state === "editInfo"} onClick={() => setState("editInfo")}>Edit</Nav.Link>
                </Nav>
                <FaTimes style={{cursor: "pointer"}} onClick={closePropertyInfo} color="white" size="1.5em"/>
              </Navbar>
              { state === "viewInfo"
                ? (<PropertyInfo property={properties.filter(p => p.id === selectedPropertyID)[0]} listingId={selectedListingID} setSelectedListingID={setSelectedListingID}/>)
                : state === "editInfo"
                && (<EditProperty latlng={clickLatLng} property={properties.filter(p => p.id === selectedPropertyID)[0]} listingId={selectedListingID} updateOnEdit={updateOnEdit}/>)
              }
            </View>
          </View>)
        }
      </View>
    </div>
  );
}

export default App;
