import React from "react";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title = "Video" }) => {
  const embedUrl = getEmbedUrl(url);

  if (!url) {
    return (
      <div className="video-placeholder">
        <span>🏓</span>
        <p>No preview video available</p>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className="video-wrapper">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback for direct video URLs
  return (
    <div className="video-wrapper">
      <video controls>
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
