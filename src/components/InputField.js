import React from "react";

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div style={styles.wrapper}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        style={styles.input}
        required
      />
      <label
        style={{
          ...styles.label,
          top: value ? "-10px" : "50%",
          fontSize: value ? "12px" : "14px",
          color: value ? "#FFD700" : "#777",
        }}
      >
        {label}
      </label>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    marginBottom: "18px",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #333",
    backgroundColor: "#000",
    color: "#fff",
    outline: "none",
  },
  label: {
    position: "absolute",
    left: "12px",
    transform: "translateY(-50%)",
    transition: "0.2s",
    pointerEvents: "none",
  },
};