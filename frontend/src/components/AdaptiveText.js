import useUIVariants from "../adaptation/useUIVariants";

export function AdaptiveHeading({
  level = 1,
  children,
  className = "",
  ...props
}) {
  const ui = useUIVariants();
  const Tag = `h${level}`;

  return (
    <Tag className={`${ui.text} ${ui.font} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function AdaptiveParagraph({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <p className={`${ui.text} ${className}`} {...props}>
      {children}
    </p>
  );
}

export function AdaptiveLabel({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <label className={`${ui.text} ${ui.font} ${className}`} {...props}>
      {children}
    </label>
  );
}

export function AdaptiveSpan({ children, className = "", ...props }) {
  const ui = useUIVariants();

  return (
    <span className={`${ui.text} ${className}`} {...props}>
      {children}
    </span>
  );
}

export function AdaptiveLink({
  children,
  className = "",
  as: Component = "a",
  ...props
}) {
  const ui = useUIVariants();

  return (
    <Component className={`${ui.text} ${className}`} {...props}>
      {children}
    </Component>
  );
}
