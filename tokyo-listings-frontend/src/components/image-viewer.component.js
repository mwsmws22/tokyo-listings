import { React, useState } from 'react'
import { useParams }  from "react-router-dom"
import ImageMasonry  from "react-image-masonry"
import ListingDataService from "../services/listing.service"

function ImageViewer() {
  const [isLoading, setIsLoading] = useState(true)
  const [photos, setPhotos] = useState()
  const { listingId } = useParams()

  ListingDataService.getWithQuery(`?id=${listingId}`)
    .then(res => {
      if (res.data.length === 1) {
        return res.data[0].url
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
    .catch(err => console.error(err))

    const onClick = (e, url) => {
      var isRightMB;
      e = e || window.event

      // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      if ("which" in e)
          isRightMB = e.which == 3;
      // IE, Opera
      else if ("button" in e)
          isRightMB = e.button == 2;

      if (!isRightMB) {
        window.open(url, "_blank")
      }
  }


  return (
    <>
      {!isLoading &&
        <div style={{margin:'1%'}}>
        <ImageMasonry numCols={5}>
          {photos.map((url, i) =>
            <div
              key={i}
              onClick={(e) => onClick(e, url)}
              style={{cursor: "pointer"}}
            >
              <img src={url} />
            </div>
          )}
        </ImageMasonry>
        </div>
      }
    </>
  )
}

export default ImageViewer
