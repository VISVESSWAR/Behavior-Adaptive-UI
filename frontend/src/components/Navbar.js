import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="navbar">
      <Link to="/">Signup</Link>
      <Link to="/recover">Recover</Link>
    </div>
  );
}
