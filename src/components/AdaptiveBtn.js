import useUIVariants from "../adaptation/useUIVariants";

export default function AdaptiveButton({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <button
      className={`rounded bg-blue-600 text-white ${ui.button} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
