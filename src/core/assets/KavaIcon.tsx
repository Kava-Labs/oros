import { SVGProps } from 'react';

const KavaIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="33"
      height="33"
      viewBox="0 0 33 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="0.5" y="0.5" width="32" height="32" rx="16" stroke="#3E3E3E" />
      <path
        d="M13.2993 8.64286H10.8837V23.6085H13.2993V8.64286Z"
        fill="#FF433E"
      />
      <path
        d="M20.0935 23.6107L14.6467 16.1257L20.0935 8.64497H23.2172L17.8432 16.1257L23.2172 23.6107H20.0935Z"
        fill="#FF433E"
      />
    </svg>
  );
};

export default KavaIcon;
