import { Erc721Metadata } from "@/types";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

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
            <img
              src={formatIPFS(metadata.image)}
              alt={metadata.name}
              className="w-full mt-4"
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
            <summary>View full JSON</summary>
            <pre>{JSON.stringify(metadata, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  );
};

export default MetadataViewer;
