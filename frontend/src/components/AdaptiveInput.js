import useUIVariants from "../adaptation/useUIVariants";

export default function AdaptiveInput(props) {
  const ui = useUIVariants();

  return (
    <input
      className={`input-base w-full p-3 ${ui.input} ${ui.text}`}
      {...props}
    />
  );
}
