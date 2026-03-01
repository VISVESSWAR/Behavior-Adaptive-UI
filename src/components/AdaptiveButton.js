import useUIVariants from "../adaptation/useUIVariants";

export default function AdaptiveButton({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <button
      className={`btn-base bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed ${ui.button} ${ui.text} ${ui.font} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
