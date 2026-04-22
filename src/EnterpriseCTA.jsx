import React from "react";

export default function EnterpriseCTA() {

  const TELEGRAM_URL = "https://t.me/your_telegram_group";
  const WHATSAPP_URL = "https://chat.whatsapp.com/your_whatsapp_group";

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>
        Join Our Winning Community
      </h2>

      <div style={styles.buttons}>

        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...styles.button, ...styles.telegram }}
        >
          Join Telegram
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...styles.button, ...styles.whatsapp }}
        >
          Join WhatsApp
        </a>

      </div>

    </div>
  );
}

const styles = {

  container: {
    textAlign: "center",
    marginTop: 30,
  },

  title: {
    color: "#d4af37",
    fontSize: 24,
    fontWeight: "bold",
  },

  buttons: {
    marginTop: 15,
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  button: {
    padding: "10px 18px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: "bold",
    color: "#fff",
  },

  telegram: {
    backgroundColor: "#229ED9",
  },

  whatsapp: {
    backgroundColor: "#25D366",
  }

};