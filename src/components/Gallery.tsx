import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=1935&auto=format&fit=crop",
    alt: "Delicious pepperoni pizza",
    caption: "Signature Pepperoni"
  },
  {
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
    alt: "Fresh pizza from oven",
    caption: "Fresh from the Oven"
  },
  {
    src: "https://deveusblob.blob.core.windows.net/kora-business-images/user-media/73602352-311b-411f-90f6-43ae046a2f29/10ba98a4-a410-4015-99d9-701074e2e5bc/1773406172_3rhcb8.jpeg",
    alt: "Restaurant interior",
    caption: "Cozy Atmosphere"
  },
  {
    src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
    alt: "Pizza preparation",
    caption: "Handcrafted with Love"
  },
  {
    src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=2069&auto=format&fit=crop",
    alt: "Ingredients",
    caption: "Fresh Ingredients"
  },
  {
    src: "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?q=80&w=2069&auto=format&fit=crop",
    alt: "Calzone",
    caption: "Famous Calzones"
  }
]

export default function Gallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentImage(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = 'auto'
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  return (
    <section id="gallery" className="py-24 bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 scroll-reveal">
          <div className="inline-block px-4 py-1 bg-red-600/10 text-red-500 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            Gallery
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Food <span className="gradient-text">Gallery</span>
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Take a visual journey through our delicious offerings and cozy atmosphere.
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`scroll-reveal img-zoom cursor-pointer group relative overflow-hidden rounded-2xl ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover aspect-square md:aspect-auto md:h-full min-h-[250px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">{image.caption}</p>
                  <p className="text-stone-300 text-sm">Click to view</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors duration-300 p-2 hover:bg-white/10 rounded-full"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-300 p-3 hover:bg-white/10 rounded-full"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button 
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-300 p-3 hover:bg-white/10 rounded-full"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div 
            className="max-w-5xl max-h-[85vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[currentImage].src}
              alt={galleryImages[currentImage].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-center text-white mt-4 text-lg font-medium">
              {galleryImages[currentImage].caption}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}