import { useEffect, useState } from "react";

const detectMediaType = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("Content-Type");

    if (contentType?.startsWith("image/")) return "image";
    if (contentType?.startsWith("video/")) return "video";
    return "unknown";
  } catch (err) {
    console.error("Error al detectar el tipo de contenido:", err);
    return "error";
  }
};

const MediaViewer = ({
  url,
  description
}: {
  url: string;
  description: string;
}) => {
  const [mediaType, setMediaType] = useState<string | null>(null);

  useEffect(() => {
    const detect = async () => {
      const type = await detectMediaType(url);
      setMediaType(type);
    };
    detect();
  }, [url]);

  if (!mediaType) return <p>Loading...</p>;

  if (mediaType === "image") {
    return <img src={url} alt={description} className="w-full rounded-lg" />;
  }

  if (mediaType === "video") {
    return (
      <video loop={true} autoPlay={true} className="w-full">
        <source src={url} type="video/mp4" />
        Your browser does not support the video.
      </video>
    );
  }

  return <p>The content type could not be determined.</p>;
};

export default MediaViewer;
