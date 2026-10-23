// Inline stroke icons, 24px grid, inheriting currentColor.

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

const make = (children) =>
  function Icon({ size = 20, ...props }) {
    return (
      <svg {...base} width={size} height={size} {...props}>
        {children}
      </svg>
    );
  };

export const CartIcon = make(
  <>
    <path d="M3 4h2.2l2.1 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20.5 8H6.2" />
    <circle cx="10" cy="20" r="1.4" />
    <circle cx="17" cy="20" r="1.4" />
  </>,
);
export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />);
export const UploadIcon = make(
  <>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </>,
);
export const DownloadIcon = make(
  <>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
  </>,
);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = make(<path d="M5 12h14" />);
export const TrashIcon = make(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </>,
);
export const UndoIcon = make(
  <>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </>,
);
export const CheckIcon = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const AlertIcon = make(
  <>
    <path d="M12 3l9.5 17h-19z" />
    <path d="M12 10v4M12 17.2v.1" />
  </>,
);
export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.6v.1" />
  </>,
);
export const ErrorIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 16.4v.1" />
  </>,
);
export const RotateIcon = make(
  <>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v5h-5" />
  </>,
);
export const CenterIcon = make(
  <>
    <path d="M12 3v18" />
    <rect x="6" y="8" width="12" height="8" rx="1" />
  </>,
);
export const ImageIcon = make(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M21 16l-5-5-9 9" />
  </>,
);
export const RulerIcon = make(
  <>
    <rect x="2.5" y="8" width="19" height="8" rx="1" />
    <path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4" />
  </>,
);
export const TruckIcon = make(
  <>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </>,
);
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const ArrowLeftIcon = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const SparkIcon = make(
  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
);
