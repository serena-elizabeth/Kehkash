import { useEffect, useRef, useState } from "react";

const events = [
  {
    year: "2019",
    title: "BEGINNING",
    text: "The first fragments.",
  },
  {
    year: "2020",
    title: "QUESTIONING",
    text: "Looking inward. Asking why.",
  },
  {
    year: "2021",
    title: "EXPRESSION",
    text: "Words began becoming worlds.",
  },
  {
    year: "2022",
    title: "DISCOVERY",
    text: "Art, music, poetry and thought intertwined.",
  },
  {
    year: "2023",
    title: "KEHKASH",
    text: "A galaxy of the heart began taking form.",
  },
  {
    year: "2024",
    title: "BECOMING",
    text: "Creating without asking for permission.",
  },
  {
    year: "2025",
    title: "EXPANSION",
    text: "More ideas. More worlds. More questions.",
  },
  {
    year: "2026",
    title: "NOW",
    text: "Still becoming.",
  },
];

export default function CinematicTimeline() {
  const sceneRef = useRef(null);

  const [active, setActive] = useState(4);
  const [selectedEvent, setSelectedEvent] = useState(4);

  const [beam, setBeam] = useState({
    angle: 0,
    x: 50,
    y: 22,
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const scene = sceneRef.current;

      if (!scene) return;

      const rect = scene.getBoundingClientRect();

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const x = (mouseX / rect.width) * 100;
      const y = (mouseY / rect.height) * 100;

      /*
       * FIXED LIGHT ORIGIN
       *
       * This point stays fixed above the timeline.
       * The beam rotates from here toward the mouse.
       */

      const originX = rect.width * 0.5;
      const originY = rect.height * 0.22;

      const dx = mouseX - originX;
      const dy = mouseY - originY;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;

      setBeam({
        angle,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  /*
   * Different floating positions.
   *
   * These are deliberately NOT a simple straight line.
   * The cards form a cinematic orbit around the silhouette.
   */

  const positions = [
    {
      x: 8,
      y: 58,
      rotate: -8,
      scale: 0.88,
    },
    {
      x: 20,
      y: 38,
      rotate: -5,
      scale: 0.92,
    },
    {
      x: 32,
      y: 27,
      rotate: -3,
      scale: 0.95,
    },
    {
      x: 45,
      y: 20,
      rotate: -1,
      scale: 1,
    },
    {
      x: 58,
      y: 24,
      rotate: 2,
      scale: 1,
    },
    {
      x: 71,
      y: 34,
      rotate: 4,
      scale: 0.96,
    },
    {
      x: 83,
      y: 45,
      rotate: 6,
      scale: 0.92,
    },
    {
      x: 93,
      y: 58,
      rotate: 8,
      scale: 0.88,
    },
  ];

const selectedPosition = positions[selectedEvent];

const beamAngle =
  Math.atan2(
    selectedPosition.y - 8,
    selectedPosition.x - 50
  ) *
    (180 / Math.PI) -
  90;

/*
 * Direction of the silhouette
 */

const silhouetteDirection =
  selectedPosition.x < 50
    ? -1
    : selectedPosition.x > 50
      ? 1
      : 0;

return (
    <section ref={sceneRef} className="cinematic-timeline cinematic-full-width">
      {/* =================================================
          MAIN IMAGE
          ================================================= */}

      <div className="cinematic-background">
        <img src="/cinematic-me.png" alt="The journey" />
      </div>

      {/* =================================================
          CINEMATIC DARK OVERLAY
          ================================================= */}

      <div className="cinematic-vignette" />

      {/* =================================================
          TITLE
          ================================================= */}

      <div className="timeline-heading">
        <span>THE JOURNEY</span>

        <h2>
          DISCOVERING
          <br />
          MYSELF
        </h2>

        <div className="heading-line" />

        <p>
          A timeline of moments,
          <br />
          questions, and discoveries.
        </p>
      </div>

      {/* =================================================
          RIGHT SIDE INSTRUCTION
          ================================================= */}

      <div className="timeline-instruction">
        <span>TAT</span>
        <span>TVAM</span>
        <span>ASI</span>

        <i />
      </div>

      {/* =================================================
          TIMELINE
          ================================================= */}

      <div className="timeline-stage">
        {/* Thin cinematic orbit line */}

        <div className="timeline-orbit orbit-back" />

        <div className="timeline-orbit orbit-front" />

        {/* Fixed beam origin */}

        <div className="timeline-light-origin">
          <span />
        </div>

        {/* Mouse-following beam */}

        <div
  className="timeline-beam"
  style={{
    transform: `rotate(${beam.angle}deg)`,
  }}
/>

        {/* =================================================
            EVENT CARDS
            ================================================= */}

        <div className="timeline-events">
          {events.map((event, index) => {
            const position = positions[index];

            const isActive = index === active;
           
            return (
              <button
                key={event.year}
                className={`timeline-event ${isActive ? "is-active" : ""}`}
                style={{
                  "--event-x": `${position.x}%`,
                  "--event-y": `${position.y}%`,
                  "--event-rotation": `${position.rotate}deg`,
                  "--event-scale": position.scale,
                }}
                onClick={() => {
                  setActive(index);
                  setSelectedEvent(index);
                }}
              >
                {/* Year marker */}

                <span className="timeline-year">{event.year}</span>

                {/* Small connection point */}

                <span className="timeline-node" />

                {/* Floating card */}

                <span className="event-card">
                  <span className="event-image" />

                  <span className="event-content">
                    <strong>{event.year}</strong>

                    <b>{event.title}</b>

                    <small>{event.text}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* =================================================
            CENTER SILHOUETTE POSITION INDICATOR
            ================================================= */}

        <div
          className={`silhouette-direction ${
            silhouetteDirection < 0
              ? "face-left"
              : silhouetteDirection > 0
                ? "face-right"
                : "face-center"
          }`}
        />

        {/* Selected event glow */}

        <div
          className="selected-event-glow"
          style={{
            left: `${selectedPosition.x}%`,
            top: `${selectedPosition.y}%`,
          }}
        />
      </div>

      {/* =================================================
          ACTIVE EVENT
          ================================================= */}

      <div className="active-event">
        <span>{events[active].year}</span>

        <h3>{events[active].title}</h3>

        <p>{events[active].text}</p>
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <div className="timeline-footer">
        <span>CURIOSITY</span>

        <span>A DIFFERENT PERSPECTIVE</span>
      </div>
    </section>
  );
}
