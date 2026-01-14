import useUIVariants from "../adaptation/useUIVariants";

export default function AdaptiveInput(props) {
  const ui = useUIVariants();

  return (
    <input
      className={`border rounded w-full ${ui.input}`}
      {...props}
    />
  );
}
