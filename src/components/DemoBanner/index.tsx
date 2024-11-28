import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../style.module.css";

export const DemoBanner: React.FC = () => {
  useEffect(() => {
    toast.info(
      "This application is in early alpha. It will produce coding errors and incorrect information. Do not rely on the generated code to be secure. Deploying this code can result in the loss of funds."
    );
  }, []);

  return (
    <>
      <div className={styles.demoBanner}>Demo</div>
      <ToastContainer autoClose={false} />
    </>
  );
};

