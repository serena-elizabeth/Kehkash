export default function InteractionPrompt({
  visible,
  label = "View artwork",
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, 28px)",
        zIndex: 20,
        pointerEvents: "none",
        color: "#fff",
        fontSize: "13px",
        letterSpacing: "0.04em",
        textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}