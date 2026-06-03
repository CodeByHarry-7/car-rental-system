import { useState, useEffect } from "react";
import styled from "styled-components";
import { api } from "../context/AuthContext";

const Container = styled.div`
  margin-top: var(--spacing-lg);
`;
const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
`;
const ImageCard = styled.div`
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: ${(props) => props.$primary ? "3px solid var(--color-primary)" : "1px solid var(--color-border)"};
`;
const CarImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
`;
const ImageActions = styled.div`
  display: flex;
  gap: 4px;
  padding: 6px;
  background: var(--color-bg);
`;
const ImgButton = styled.button`
  flex: 1;
  padding: 4px;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  background: ${(props) => (props.$danger ? "#fee2e2" : "#e0f2fe")};
  color: ${(props) => (props.$danger ? "#dc2626" : "#0369a1")};
  &:hover { opacity: 0.8; }
`;
const PrimaryBadge = styled.span`
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
`;
const UploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  gap: var(--spacing-sm);
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;
const UploadButton = styled.button`
  padding: 10px var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-top: var(--spacing-md);
  &:hover { background: var(--color-primary-dark); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const SelectedFiles = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
`;

const CarImages = ({ carId }) => {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, [carId]);

  const fetchImages = async () => {
    const res = await api.get(`/car-images/${carId}`);
    setImages(res.data);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("images", file));
      await api.post(`/car-images/${carId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFiles([]);
      fetchImages();
    } catch (err) {
      alert("Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await api.put(`/car-images/${carId}/primary/${imageId}`);
      fetchImages();
    } catch (err) {
      alert("Error setting primary image");
    }
  };

  const handleDelete = async (imageId) => {
    try {
      await api.delete(`/car-images/${imageId}`);
      fetchImages();
    } catch (err) {
      alert("Error deleting image");
    }
  };

  return (
    <Container>
      <ImageGrid>
        {images.map((image) => (
          <ImageCard key={image.id} $primary={image.is_primary}>
            {image.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
            <CarImage src={image.image_url} alt="Car" />
            <ImageActions>
              {!image.is_primary && (
                <ImgButton onClick={() => handleSetPrimary(image.id)}>Set Primary</ImgButton>
              )}
              <ImgButton $danger onClick={() => handleDelete(image.id)}>Delete</ImgButton>
            </ImageActions>
          </ImageCard>
        ))}
      </ImageGrid>

      <UploadArea>
        <span>Click to select images</span>
        <span style={{ fontSize: "11px" }}>Max 5 images, 5MB each</span>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </UploadArea>

      {selectedFiles.length > 0 && (
        <SelectedFiles>{selectedFiles.length} file(s) selected</SelectedFiles>
      )}

      <UploadButton onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
        {uploading ? "Uploading..." : "Upload Images"}
      </UploadButton>
    </Container>
  );
};

export default CarImages;