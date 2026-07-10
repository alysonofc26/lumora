import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Hls from "hls.js";
import "./PlayerPage.css";

const API = "/api";

export default function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    fetch(API + "/items/" + id).then(r => r.json()).then(data => {
      setItem(data);
      setLoading(false);
    }).catch(() => { setError("Erro ao carregar"); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!item?.stream_url || !videoRef.current) return;
    const video = videoRef.current;
    const url = item.stream_url;
    setError(null);
    if (url.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) { hls.startLoad(); }
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); }
          else { setError("Erro ao carregar stream"); hls.destroy(); }
        }
      });
      hlsRef.current = hls;
    } else if (url.includes(".mp4") || url.includes(".webm") || url.includes(".mkv")) {
      video.src = url;
      video.play().catch(() => {});
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      setError("Formato nao suportado");
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [item]);

  const content = (
    <div className="nf-player">
      {loading && (
        <div className="nf-loading">
          <div className="nf-spinner"></div>
        </div>
      )}

      {error && !loading && (
        <div className="nf-error">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Voltar</button>
        </div>
      )}

      {!loading && !error && (
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="nf-video"
          onEnded={() => navigate(-1)}
        />
      )}

      <button className="nf-back" onClick={() => navigate(-1)}>&#8249;</button>
    </div>
  );

  return createPortal(content, document.body);
}
