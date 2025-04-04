import { useState } from 'react';
import styles from './ImageCarousel.module.css';
import { IdbImage } from '../IdbImage';

type ImageCarouselProps = {
  imageIDs: string[];
};

export const ImageCarousel = ({ imageIDs }: ImageCarouselProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [slideIndex, setSlideIndex] = useState(1);

  //  Function to show current slide
  const showSlides = (n: number) => {
    let index = n;
    if (n > imageIDs.length) {
      index = 1;
    }
    if (n < 1) {
      index = imageIDs.length;
    }
    setSlideIndex(index);
  };

  //  Function for next/previous controls
  const plusSlides = (n: number) => {
    showSlides(slideIndex + n);
  };

  //  Function for specific slide control
  const currentSlide = (n: number) => {
    showSlides(n);
  };

  return (
    <div className={isLoaded ? styles.visible : styles.hidden}>
      <div className={styles.slideshowContainer}>
        {imageIDs.map((imageID, index) => (
          <div
            key={index}
            className={`${styles.mySlides} ${index + 1 === slideIndex ? styles.activeSlide : ''} ${styles.fade}`}
          >
            <div className={styles.paginationNumber}>
              {index + 1} / {imageIDs.length}
            </div>
            <IdbImage
              id={imageID}
              alt={`Slide ${index + 1}`}
              className={styles.image}
              aria-label="File upload chat message"
              //  we only need to update the loading state for the first file
              onLoad={index === 0 ? () => setIsLoaded(true) : undefined}
            />
          </div>
        ))}

        <a className={styles.prev} onClick={() => plusSlides(-1)}>
          &#10094;
        </a>
        <a className={styles.next} onClick={() => plusSlides(1)}>
          &#10095;
        </a>
      </div>

      {imageIDs.length <= 12 ? (
        <div className={styles.dotsContainer}>
          {imageIDs.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index + 1 === slideIndex ? styles.activeDot : ''}`}
              onClick={() => currentSlide(index + 1)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
