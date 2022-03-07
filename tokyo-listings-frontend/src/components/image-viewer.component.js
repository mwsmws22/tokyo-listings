import { React, useState } from 'react'
import { useParams }  from "react-router-dom"
import ImageMasonry  from "react-image-masonry"
import ListingDataService from "../services/listing.service"

const imageStyle = { cursor: "pointer" }
const imageStyleDisabled = { pointerEvents: "none" }

function ImageViewer() {
  const [queryStarted, setQueryStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [noFetcher, setNoFetcher] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [imagesNotFound, setImagesNotFound] = useState(false)
  const [sqlError, setSqlError] = useState(false)
  const [unknownError, setUnknownError] = useState(false)
  const [url, setUrl] = useState()
  const [photos, setPhotos] = useState()
  const { listingId } = useParams()

  if (!queryStarted) {
    setQueryStarted(true)

    ListingDataService.getWithQuery(`?id=${listingId}`)
      .then(res => {
        if (res.data.length === 1) {
          setUrl(res.data[0].url)
          return res.data[0]
        } else {
          throw new Error(`Issue with response data: ${res.data}`)
        }
      })
      .then(ListingDataService.getImages)
      .then(res => {
        if (res.data !== 'nope') {
          setPhotos(res.data)
          setIsLoading(false)
        }
      })
      .catch(e => {
        if (e.response) {
          const error = e.response.data.message

          if (error.includes('no image fetcher')) {
            setNoFetcher(true)
          } else if (error.includes('images not found')) {
            setImagesNotFound(true)
          } else {
            setServerError(true)

            console.log("SERVER ERROR: ")
            console.log(error)
          }
        } else {
          if (e.message.includes('Issue with response data')) {
            setSqlError(true)
          } else {
            setUnknownError(true)
            console.log("UNKNOWN ERROR: ")
          }
          console.log(e)
        }
        setIsLoading(false)
    })
  }

  const onClick = (e, url) => {
    var isRightMB;
    e = e || window.event

    // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
    if ("which" in e)
        isRightMB = e.which === 3;
    // IE, Opera
    else if ("button" in e)
        isRightMB = e.button === 2;

    if (!isRightMB) {
      window.open(url, "_blank")
    }
  }

  return (
    <>
      {!isLoading && (
        sqlError ?
          <div>
            <div>Number of listings returned from SQL query is incorrect. Must be 1.</div>
            <div>{`listingId: ${listingId}`}</div>
          </div>
        : noFetcher ?
          <div>{`Currently unable to fetch images for this site: ${new URL(url).hostname}`}</div>
        : imagesNotFound ?
          <div>{`Images not found for this URL: ${url}`}</div>
        : serverError ?
          <div>
            <div>Image server error. View full error Chrome Console.</div>
            <div>{`url: ${url}`}</div>
          </div>
        : unknownError ?
          <div>Unknown error. Hell if I know. Try checking Chrome Console.</div>
        :
        <div style={{margin:'1%'}}>
          <ImageMasonry numCols={5}>
            {photos.map((pUrl, i) =>
              <div key={i} onClick={(e) => onClick(e, pUrl)} style={url.includes('homes.co.jp') ? imageStyleDisabled : imageStyle}>
                <img src={pUrl} />
              </div>
            )}
          </ImageMasonry>
        </div>
      )}
    </>
  )
}

export default ImageViewer
