type GalleryProps = {
  images: string[];
};

function Gallery({ images }: GalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <section id="gallery">
      <div className="container">
        <h2>Gallery</h2>
        <div className="gallery-grid">
          {images.map((src, index) => (
            <div key={index} className="gallery-item">
              <img src={src} alt={`Gallery image ${index + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;