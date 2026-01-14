import React from "react";
import "./HomePage.css";

export default function HomePage({ uiSchema }) {
  const {
    buttonScale,
    cardScale,
    spacingScale,
    fontScale
  } = uiSchema;

  return (
    <div
      className="homepage"
      style={{
        gap: `${16 * spacingScale}px`,
        fontSize: `${14 * fontScale}px`
      }}
    >
      <header className="header">
        <h1>Adaptive Interaction Portal</h1>
        <p>Behavior-aware user interface</p>
      </header>

      <section className="card-grid">
        {[1, 2, 3].map(id => (
          <div
            key={id}
            className="card"
            style={{
              transform: `scale(${cardScale})`
            }}
          >
            <h3>Feature {id}</h3>
            <p>
              This interface is designed for future behavior-driven adaptation.
            </p>

            <button
              className="primary-btn"
              style={{
                transform: `scale(${buttonScale})`
              }}
            >
              Action
            </button>
          </div>
        ))}
      </section>

      <section className="cta">
        <button
          className="cta-btn"
          style={{
            transform: `scale(${buttonScale * 1.2})`
          }}
        >
          Get Started
        </button>
      </section>
    </div>
  );
}
