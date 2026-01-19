import useUIVariants from "../adaptation/useUIVariants";

export default function AdaptiveButton({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <button
      className={`btn-base bg-blue-600 text-white hover:bg-blue-700 ${ui.button} ${ui.text} ${ui.font} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
