import {
 generateShareMessage,
 shareToWhatsApp,
 shareToTelegram,
 shareToX,
 shareToFacebook,
 copyPrediction
} from "../services/shareService";

export default function SharePrediction({ prediction }) {

 const message = generateShareMessage(prediction);

 return (
  <div className="share-buttons">

   <button onClick={() => shareToWhatsApp(message)}>
    WhatsApp
   </button>

   <button onClick={() => shareToTelegram(message)}>
    Telegram
   </button>

   <button onClick={() => shareToX(message)}>
    X
   </button>

   <button onClick={() => shareToFacebook(message)}>
    Facebook
   </button>

   <button onClick={() => copyPrediction(message)}>
    Instagram
   </button>

  </div>
 );
}