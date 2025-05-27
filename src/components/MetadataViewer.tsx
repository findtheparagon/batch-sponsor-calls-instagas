import { Erc721Metadata } from "@/types";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
    return <img src={url} alt={description} className="w-full mt-4" />;
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

interface MetadataViewerProps {
  uri: string;
}

const MetadataViewer: React.FC<MetadataViewerProps> = ({ uri }) => {
  const [metadata, setMetadata] = useState<Erc721Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatIPFS = (url?: string) => {
    if (!url) return "";
    return url.startsWith("ipfs://")
      ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
      : url;
  };

  const fetchMetadata = async () => {
    setError(null);
    setMetadata(null);
    setLoading(true);

    try {
      const res = await fetch(formatIPFS(uri));
      if (!res.ok) throw new Error("Failed to fetch metadata");
      const data: Erc721Metadata = await res.json();
      setMetadata(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-2xl p-4 mt-4">
      <Button
        onClick={fetchMetadata}
        style={{ padding: "8px 16px", marginBottom: 10 }}
      >
        {!loading && <>Load Metadata</>}
        {loading && <>Loading metadata...</>}
      </Button>

      {error && <p className="text-red-600">Error: {error}</p>}

      {metadata && (
        <>
          <h3>{metadata.name}</h3>
          <p>
            <strong>Description:</strong> {metadata.description || "N/A"}
          </p>
          {metadata.image && (
            <MediaViewer
              url={formatIPFS(metadata.image)}
              description={metadata.name}
            />
          )}
          {metadata.attributes && metadata.attributes?.length > 0 && (
            <div className="mt-4">
              <h4>Attributes:</h4>
              <ul>
                {metadata.attributes.map((attr, idx) => (
                  <li key={idx}>
                    <strong>{attr.trait_type ?? "Type"}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer">View full JSON</summary>
            <pre>{JSON.stringify(metadata, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  );
};

export default MetadataViewer;
