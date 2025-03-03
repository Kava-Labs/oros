interface MobileBackdropProps {
  styles: string;
  onBackdropClick: () => void;
}

//  this component handles closing mobile sidebar on outside click
export const MobileBackdrop = ({
  styles,
  onBackdropClick,
}: MobileBackdropProps) => {
  return <div className={styles} onClick={onBackdropClick} />;
};
