import { useEffect, useState } from "react";
import { post } from "../api";

export default function ResultPage() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function recover() {
      const email = localStorage.getItem("email");
      const shares = JSON.parse(localStorage.getItem("shares"));
      const res = await post("/recover/finish", { email, shares });
      setResult(res);
    }
    recover();
  }, []);

  return (
    <div className="container">
      <h2>Recovery Result</h2>

      {result?.success && (
        <>
          <p><b>Account Recovered</b></p>
          <p style={{ wordBreak: "break-all" }}>
            {result.masterKey}
          </p>
        </>
      )}

      {result && !result.success && (
        <p>Recovery failed. Invalid shares.</p>
      )}
    </div>
  );
}
