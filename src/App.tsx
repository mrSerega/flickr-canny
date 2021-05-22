import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Header } from './Header/Header';
import cv from "@techstark/opencv-js";

export interface FlickrImage {
  server: string
  id: string
  secret: string;
}

export type Size = // 500 by default
  "s" // 75
  | "q" // 150
  | "t" // 100
  | "m" // 240
  | "n" // 320
  | "w" // 400
  | "z" // 640
  | "c" // 800
  | "b" // 1024
  | "h" // 1600

const getImageUrl = (image: FlickrImage, size?: Size) => {
  const baseImageUrl = `https://live.staticflickr.com`
  return `${baseImageUrl}/${image.server}/${image.id}_${image.secret}_${size}.jpg`
}

function App() {

  const [images, setImgaes] = useState<FlickrImage[]>([])
  const [page, setPage] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [request, setRequest] = useState('')
  const [modalImage, setModalImage] = useState<FlickrImage | null>(null)

  const scroller = useRef<HTMLDivElement>(null);
  const canvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    window.addEventListener("scroll", (evt) => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        setPage(page +1)
      }
    })
    // TODO: remove event listener
  })

  useEffect(() => {
    const apiCall = async () => {

      setLoading(true)

      if (!request || page === -1) {
        setLoading(false)
        return
      }

      const baseUrl = 'https://api.flickr.com/services/rest'
      const method = 'flickr.photos.search'
      const apiKey = 'ef1f9d4f8ca80dada31c684364355282'
      const sig = 'd7f57fa9e01a6a2d6ccd8597b8d2f86b'

      const url = `${baseUrl}?method=${method}&api_key=${apiKey}&FLickrApi_sig=${sig}&nojsoncallback=1&format=json&&page=${page}&per_page=50&content_type=7&extras=owner_name,date_upload&text=${request}`

      const response = await fetch(url)
      if (!response.ok) {
        // TODO: error handler
        setLoading(false)
        return
      }
      const json = await response.json()


      const imageUrls: FlickrImage[] = json.photos.photo

      setImgaes([...images, ...imageUrls])
      setLoading(false)
    }
    apiCall();
  }, [page, request])

  useEffect(() => {

    // console.log('')

    if (!modalImage || !canvRef.current) {
      // TODO: handleError
      return
    }

    const imgLoader = new Promise((res, rej) => {

      console.log('START')

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(modalImage, "b");

      img.onerror = error => rej(error);


      img.onload = () => {

        if (!canvRef.current) {
          rej('No canvas')
          return
        }

        const context = canvRef.current.getContext('2d');

        if (!context) {
          rej('No context')
          return
        }

        canvRef.current.width = img.width;
        canvRef.current.height = img.height;
        context.drawImage(img, 0, 0);

        const src = cv.imread(canvRef.current)
        let dst = new cv.Mat();
        cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
        cv.Canny(src, dst, 50, 100, 3, false);
        cv.imshow(canvRef.current, dst);
        src.delete(); dst.delete();

        res(canvRef.current.toDataURL('image/jpeg'));

      };

    })
  }, [modalImage])

  return (
    <div className="App">
      <div className="App-Header">
        <Header
          onChange={val => {
            setRequest(val)
            setImgaes([])
            setPage(0)
          }}
        />
      </div>
      <div className="App-SearchResult"
        ref={scroller}
      >
        {(images.length || loading) ? images.map((item: FlickrImage) => <div className="App-ImageItem">
          <div className="App-Image"
            style={{
              background: `url(${getImageUrl(item, "m")}) no-repeat center`
            }}
            onClick={() => setModalImage(item)}
          />
        </div>) : <div className="App-Empty">
            Empty request <span className="App-EmptyPick">¯\_(ツ)_/¯</span>
        </div> }
      </div>
      {loading && <div className="App-Loading">Loading...</div>}
      {modalImage && <div className="ModalImage">
        <div className="ModalImage-Header">
          <div className="ModalImage-Meta">
            {`${modalImage.server}/${modalImage.id}_${modalImage.secret}`}
          </div>
          <div className="ModalImage-Close"
            onClick={()=> setModalImage(null)}
          />
        </div>
        <div className="ModalImage-Output">
          <canvas ref={canvRef}/>
        </div>
      </div>}
    </div>
  );
}

export default App;
