import { useEffect, useState } from 'react';
import styles from './TokenCard.module.css';
import { imagedb } from './imagedb';
import { LoadingSpinner } from './LoadingSpinner';
import { LaunchIcon } from './assets/LaunchIcon';

export interface TokenCardProps {
  id: string;
  name: string;
  symbol: string;
  about: string;

  onRendered(): void;
}

export const TokenCard = ({
  id,
  name,
  symbol,
  about,
  onRendered,
}: TokenCardProps) => {
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const handleLaunchClick = () => {
    const tokenMetadata = {
      base64ImageData: imageUri,
      tokenName: name,
      tokenSymbol: symbol,
      tokenDescription: about,
    };

    // Send message to the parent window from the iframe
    window.parent.postMessage(
      { type: 'GENERATED_TOKEN_METADATA', payload: tokenMetadata },
      '*',
    );
  };

  useEffect(() => {
    let cancel = false;
    const getImageUri = async () => {
      let uri;
      try {
        uri = await imagedb.get(id);
      } catch (error) {
        console.error(error);
        uri = '';
      }

      if (!cancel) {
        setImageUri(uri);
      }
    };

    getImageUri();

    return () => {
      cancel = true;
    };
  }, [id]);

  useEffect(() => {
    requestAnimationFrame(onRendered);
  }, [name, symbol, about, imageUri, onRendered]);

  const isLoading = imageUri === undefined;

  return (
    <div className={styles.wrapper}>
      <div>
        <h6>
          <strong>
            {name} ({symbol})
          </strong>
        </h6>
      </div>
      {isLoading && (
        <div>
          <LoadingSpinner />
        </div>
      )}
      {imageUri === '' && (
        <div className={styles.imageError}>
          <p>Error: Failed to create image</p>
        </div>
      )}
      {imageUri !== undefined && imageUri !== '' && (
        <div>
          <img alt="Model Generated Image" src={imageUri} />
        </div>
      )}
      <div>
        <p>{about}</p>
      </div>
      {!isLoading && (
        <div id={styles.launchButtonContainer}>
          <button
            id={styles.launchButton}
            aria-label="Launch Token"
            onClick={handleLaunchClick}
          >
            <LaunchIcon />

            <span>Launch</span>
          </button>
        </div>
      )}
    </div>
  );
};
