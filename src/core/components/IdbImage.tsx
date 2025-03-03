import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { getImage } from '../utils/idb/idb';

interface IdbImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const IdbImage = ({ id, ...props }: IdbImageProps) => {
  const [base64URL, setBase64URL] = useState('');

  useEffect(() => {
    getImage(id)
      .then((img) => {
        if (img) {
          setBase64URL(img.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  return !base64URL.length ? null : <img src={base64URL} {...props} />;
};
