import { useEffect, useState } from 'react';
import styles from './TokenCard.module.css';
import { imagedb } from './imagedb';
import { LoadingSpinner } from './LoadingSpinner';
import { LaunchIcon } from './assets/LaunchIcon';
import { useToolCallStream } from './useToolCallStream';
import { ToolCallStore } from './toolCallStore';

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

  const isInIframe = window === window.parent;
  const isLoading = imageUri === undefined;
  const isImageError = imageUri === '';

  let imageWrapperStyles = styles.imageWrapper;
  if (isImageError) {
    imageWrapperStyles += ` ${styles.imageError}`;
  }

  return (
    <div className={styles.tokenCardWrapper}>
      <div className={styles.tokenCard}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.tokenName}>{name}</h2>
            <div className={styles.tokenSymbol}>{symbol}</div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={imageWrapperStyles}>
            <div className={styles.tokenImage}>
              {isLoading && <LoadingSpinner />}

              {isImageError && (
                <div className={styles.imageErrorText}>
                  <p>Error: Failed to create image</p>
                </div>
              )}

              {!isLoading && !isImageError && (
                <img
                  alt="Model Generated Image"
                  src={imageUri}
                  className={styles.tokenImage}
                />
              )}
            </div>
          </div>
          <div className={styles.descriptionContainer}>
            <h3 className={styles.infoTitle}>Token Info</h3>
            <p className={styles.description}>{about}</p>
            {!isLoading && !isImageError && !isInIframe && (
              <button className={styles.tokenButton}>
                <LaunchIcon />
                Launch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// hidden component that only renders when a generateCoinMetadata tool call request
// is being streamed by the model
export const TokenCardStreamingPlaceholder = ({
  toolCallStore,
}: {
  toolCallStore: ToolCallStore;
}) => {
  const toolCallStreams = useToolCallStream(toolCallStore);

  if (!toolCallStreams.length) return null;

  const generateCoinMetadataStream = toolCallStreams.find(
    (tc) => tc.name === 'generateCoinMetadata',
  );
  if (!generateCoinMetadataStream) return null;

  const nameStream =
    (generateCoinMetadataStream.arguments.name as string) ?? '';
  const symbolStream =
    (generateCoinMetadataStream.arguments.symbol as string) ?? '';
  const aboutStream =
    (generateCoinMetadataStream.arguments.about as string) ?? '';

  return (
    <div className={styles.tokenCardWrapper}>
      <div className={styles.tokenCard}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.tokenName}>{nameStream}</h2>
            <div className={styles.tokenSymbol}>{symbolStream}</div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.imageWrapper}>
            <div className={styles.tokenImage}>{<LoadingSpinner />}</div>
          </div>
          <div className={styles.descriptionContainer}>
            <h3 className={styles.infoTitle}>Token Info</h3>
            <p className={styles.description}>{aboutStream}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
