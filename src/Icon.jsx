export default function Icon({ name, ...props }) {
  return <i className={`fa-${name}`} aria-hidden="true" {...props} />;
}
