import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../LoadingSpinner';
import styles from './ImageLoading.module.css';

export const ImageLoading = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots((prev) => {
        if (prev.length > 5) return '.';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <h3 className={styles.title}>generating Image {dots}</h3>
      <div>
        <LoadingSpinner />
      </div>
    </>
  );
};
