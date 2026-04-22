export const generateShareMessage = (prediction = {}) => {

  const match = prediction.match || "Match prediction";
  const predictionTip = prediction.prediction || "Tip not available";
  const odds = prediction.odds || "N/A";
  const league = prediction.league || "";
  const date = prediction.date || "";

  return `🔥 HYSMART VIP Prediction

${league ? `League: ${league}\n` : ""}Match: ${match}
${date ? `Date: ${date}\n` : ""}Prediction: ${predictionTip}
Odds: ${odds}

Get daily winning predictions 👇
https://hysmartprediction.com

Shared via HYSMART Prediction App`;
};


// ===============================
// WhatsApp
// ===============================
export const shareToWhatsApp = (message) => {

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");

};


// ===============================
// Telegram
// ===============================
export const shareToTelegram = (message) => {

  const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");

};


// ===============================
// X (Twitter)
// ===============================
export const shareToX = (message) => {

  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");

};


// ===============================
// Facebook
// ===============================
export const shareToFacebook = (message) => {

  const url = `https://www.facebook.com/sharer/sharer.php?u=https://hysmartprediction.com&quote=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");

};


// ===============================
// Copy for Instagram
// ===============================
export const copyPrediction = async (message) => {

  try {

    if (navigator.clipboard && window.isSecureContext) {

      await navigator.clipboard.writeText(message);

    } else {

      const textArea = document.createElement("textarea");
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

    }

    alert("Prediction copied! Paste it on Instagram.");

  } catch (error) {

    console.error("Copy failed:", error);
    alert("Unable to copy prediction");

  }

};