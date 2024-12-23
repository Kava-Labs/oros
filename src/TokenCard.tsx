import { useEffect, useState, useSyncExternalStore } from 'react';
import styles from './TokenCard.module.css';
import { imagedb } from './imagedb';
import { LaunchIcon } from './assets/LaunchIcon';
import { ToolCallStreamStore } from './toolCallStreamStore';
import { ToolFunctions, type GenerateCoinMetadataParams } from './tools/types';
import ImageLoader from './ImageLoader';

export interface TokenCardProps {
  id: string;
  name: string;
  symbol: string;
  about: string;
  prompt: string;
  onRendered(): void;
}

export const TokenCard = ({
  id,
  name,
  symbol,
  about,
  onRendered,
  prompt,
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
            <h4 className={styles.tokenName}>{name}</h4>
            <div className={styles.tokenSymbol}>{symbol}</div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={imageWrapperStyles}>
            <div className={styles.tokenImage}>
              {isLoading && <ImageLoader prompt={prompt} />}

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
            <h6 className={styles.infoTitle}>Token Info</h6>
            <p className={styles.description}>{about}</p>
            {!isLoading && !isImageError && !isInIframe && (
              <button
                className={styles.tokenButton}
                onClick={handleLaunchClick}
              >
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

export const TokenCardsStreamingPlaceholder = ({
  toolCallStreamStore,
  onRendered,
}: {
  toolCallStreamStore: ToolCallStreamStore;
  onRendered: () => void;
}) => {
  const toolCallStreams = useSyncExternalStore(
    toolCallStreamStore.subscribe,
    toolCallStreamStore.getSnapShot,
  );

  useEffect(() => {
    if (
      toolCallStreams.find(
        (tc) => tc.function.name === ToolFunctions.GENERATE_COIN_METADATA,
      ) !== undefined
    ) {
      requestAnimationFrame(onRendered);
    }
  }, [toolCallStreams, onRendered]);

  return toolCallStreams.map((tcStream) => {
    if (tcStream.function.name !== ToolFunctions.GENERATE_COIN_METADATA) {
      return null;
    }

    const argsStream = tcStream.function
      .arguments as Partial<GenerateCoinMetadataParams>;

    return (
      <div key={tcStream.id} className={styles.left}>
        <div className={styles.tokenCardWrapper}>
          <div className={styles.tokenCard}>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <h4 className={styles.tokenName}>{argsStream.name ?? ''}</h4>
                <div className={styles.tokenSymbol}>
                  {argsStream.symbol ?? ''}
                </div>
              </div>
            </div>
            <div className={styles.content}>
              <div className={styles.imageWrapper}>
                <div className={styles.tokenImage}>
                  <ImageLoader prompt={argsStream.prompt ?? ''} />
                </div>
              </div>
              <div className={styles.descriptionContainer}>
                <h6 className={styles.infoTitle}>Token Info</h6>
                <p className={styles.description}>{argsStream.about ?? ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
};
