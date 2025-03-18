import styles from './FileUploadPreviews.module.css';
import { IdbImage } from './IdbImage';
import ButtonIcon from './ButtonIcon';
import { X } from 'lucide-react';
import { FileUpload } from './ChatInput';

interface FileUploadPreviewsProps {
  uploadedFiles: FileUpload[];
  setHoverImageId: (id: string | null) => void;
  removeImage: (id: string) => void;
}

export const FileUploadPreviews = ({
  uploadedFiles,
  setHoverImageId,
  removeImage,
}: FileUploadPreviewsProps) => {
  return (
    <div className={styles.imagePreviewContainer}>
      <div className={styles.imagePreviewWrapper}>
        {uploadedFiles.map(({ id }) => (
          <div
            key={id}
            className={styles.imageCard}
            onMouseEnter={() => setHoverImageId(id)}
            onMouseLeave={() => setHoverImageId(null)}
          >
            <IdbImage id={id} className={styles.cardImage} />
            <ButtonIcon
              icon={X}
              className={styles.removeButton}
              onClick={() => removeImage(id)}
              aria-label="Remove image"
              size={14}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
