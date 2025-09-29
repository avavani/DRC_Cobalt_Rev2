/**
 * A unified slide deck object that handles both map and image slides
 */
class SlideDeck {
  /**
   * Constructor for the SlideDeck object.
   * @param {Node} container The container element for the slides.
   * @param {NodeList} slides A list of HTML elements containing the slide text.
   * @param {L.map} map The Leaflet map where data will be shown.
   */
  constructor(container, slides, map) {
    this.container = container;
    this.slides = slides;
    this.map = map;
    this.currentSlideIndex = 0;

    // Initialize map layer
    this.dataLayer = L.layerGroup().addTo(map);

    // Try to find image element for image slides
    this.imageElement = document.getElementById('story-image');
    if (this.imageElement) {
      this.setupImageElement();
    }

    // Set initial visibility based on first slide
    this.initializeVisibility();
  }

  /**
   * ### initializeVisibility
   * Set initial container visibility - start with image and map hidden
   */
  initializeVisibility() {
    // Start with both containers hidden
    this.hideImageContainer();
    this.hideMapContainer();
    
    // Only show the appropriate container when we sync to first slide
  }

  /**
   * ### setupImageElement
   * Configure the image element with appropriate styling for smooth transitions
   */
  setupImageElement() {
    // Enhanced transition properties for smoother appearance
    this.imageElement.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
    this.imageElement.style.objectFit = 'cover';
    this.imageElement.style.width = '100%';
    this.imageElement.style.height = '100%';
    this.imageElement.style.transformOrigin = 'center center';
    
    // Set up the parent container for smoother transitions
    if (this.imageElement.parentElement) {
      this.imageElement.parentElement.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
      this.imageElement.parentElement.style.overflow = 'hidden';
    }
  }

  /**
   * ### isMapSlide
   * Check if a slide is a map slide
   * @param {HTMLElement} slide The slide element
   * @return {boolean} True if it's a map slide
   */
  isMapSlide(slide) {
    return slide.dataset.type === 'map' || !slide.dataset.type;
  }

  /**
   * ### isImageSlide
   * Check if a slide is an image slide
   * @param {HTMLElement} slide The slide element
   * @return {boolean} True if it's an image slide
   */
  isImageSlide(slide) {
    return slide.dataset.type === 'image';
  }

  /**
   * ### updateDataLayer
   * Update map data layer (for map slides)
   */
  updateDataLayer(data) {
    if (!this.map || !this.dataLayer) return null;

    this.dataLayer.clearLayers();

    const geoJsonLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 4,
          fillColor: 'white',
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        });
      },
      style: (feature) => {
        return {
          color: 'white',
          fillColor: 'white',
          fillOpacity: 0.2,
          weight: 2,
        };
      },
    })
        .bindTooltip((l) => l.feature.properties.label)
        .addTo(this.dataLayer);

    return geoJsonLayer;
  }

  /**
   * ### updateImage
   * Update the displayed image with enhanced smooth transitions
   */
  updateImage(imageSrc) {
    if (!this.imageElement || !imageSrc) return;

    // Create a smooth fade and subtle scale transition
    this.imageElement.style.opacity = '0..3';
    
    // Load new image
    const img = new Image();
    img.onload = () => {
      // Small delay to ensure the fade out is visible
      setTimeout(() => {
        this.imageElement.src = imageSrc;
        // Animate back to normal state with smooth transition
        this.imageElement.style.opacity = '1';
      }, 100);
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${imageSrc}`);
      // Restore visibility even if image fails to load
      setTimeout(() => {
        this.imageElement.style.opacity = '1';
      }, 100);
    };
    img.src = imageSrc;
  }

  /**
   * ### getSlideFeatureCollection
   * Load the slide's features from a GeoJSON file (for map slides)
   */
  async getSlideFeatureCollection(slide) {
    try {
      const response = await fetch(`./data/${slide.id}.geojson`);
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }

  /**
   * ### getSlideImageSrc
   * Get the image source for a slide (for image slides)
   */
  getSlideImageSrc(slide) {
    const imageId = slide.id;
    const format = slide.dataset.format || 'jpg';
    // Adjust this path based on your file structure
    return `img/${imageId}.${format}`;
  }

  /**
   * ### syncMapToSlide
   * Update map for a map slide
   */
  async syncMapToSlide(slide) {
    if (!this.map) return;

    const collection = await this.getSlideFeatureCollection(slide);
    if (!collection) return;

    const layer = this.updateDataLayer(collection);

    /**
     * Create a bounds object from a GeoJSON bbox array.
     */
    const boundsFromBbox = (bbox) => {
      const [west, south, east, north] = bbox;
      const bounds = L.latLngBounds(
          L.latLng(south, west),
          L.latLng(north, east),
      );
      return bounds;
    };

    /**
     * Create a temporary event handler that will show tooltips on the map
     * features, after the map is done "flying" to contain the data layer.
     */
    const handleFlyEnd = () => {
      if (slide.showpopups) {
        layer.eachLayer((l) => {
          l.bindTooltip(l.feature.properties.label, { permanent: true });
          l.openTooltip();
        });
      }
      this.map.removeEventListener('moveend', handleFlyEnd);
    };

    this.map.addEventListener('moveend', handleFlyEnd);
    if (collection.bbox) {
      this.map.flyToBounds(boundsFromBbox(collection.bbox));
    } else {
      this.map.flyToBounds(layer.getBounds());
    }
  }

  /**
   * ### syncImageToSlide
   * Update image for an image slide with smooth transitions
   */
  syncImageToSlide(slide) {
    if (!this.imageElement) {
      console.warn('No image element found');
      return;
    }
    
    const imageSrc = this.getSlideImageSrc(slide);
    console.log('Syncing image to slide:', slide.id, 'Image src:', imageSrc);
    this.updateImage(imageSrc);
  }

  /**
   * ### syncToSlide
   * Universal method to sync to any slide type
   */
  async syncToSlide(slide) {
    if (this.isMapSlide(slide)) {
      // Show map, hide image with smooth transition
      this.showMapContainer();
      this.hideImageContainer();
      await this.syncMapToSlide(slide);
    } else if (this.isImageSlide(slide)) {
      // Show image, hide map with smooth transition
      this.showImageContainer();
      this.hideMapContainer();
      this.syncImageToSlide(slide);
    }
  }

  /**
   * ### showImageContainer
   * Show the image container with smooth transition
   */
  showImageContainer() {
    if (this.imageElement && this.imageElement.parentElement) {
      this.imageElement.parentElement.classList.add('active');
      // Ensure visibility is set immediately
      this.imageElement.parentElement.style.visibility = 'visible';
      // Don't animate the container opacity - let individual images handle their own transitions
    }
  }

  /**
   * ### hideImageContainer
   * Hide the image container with smooth transition
   */
  hideImageContainer() {
    if (this.imageElement && this.imageElement.parentElement) {
      this.imageElement.parentElement.classList.remove('active');
      // Don't animate container opacity - individual images handle their transitions
      // Hide visibility immediately since images will fade themselves
      this.imageElement.parentElement.style.visibility = 'hidden';
    }
  }

  /**
   * ### showMapContainer
   * Show the map container
   */
  showMapContainer() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.classList.add('active');
    }
  }

  /**
   * ### hideMapContainer
   * Hide the map container
   */
  hideMapContainer() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.classList.remove('active');
    }
  }

  /**
   * ### hideAllSlides
   * Add the hidden class to all slides' HTML elements.
   */
  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }
  }

  /**
   * Show the slide with ID matched by currentSlideIndex.
   */
  syncToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.syncToSlide(slide);
  }

  /**
   * Increment the currentSlideIndex and show the corresponding slide.
   */
  goNextSlide() {
    this.currentSlideIndex++;

    if (this.currentSlideIndex === this.slides.length) {
      this.currentSlideIndex = 0;
    }

    this.syncToCurrentSlide();
  }

  /**
   * Decrement the currentSlideIndex and show the corresponding slide.
   */
  goPrevSlide() {
    this.currentSlideIndex--;

    if (this.currentSlideIndex < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    }

    this.syncToCurrentSlide();
  }

  /**
   * ### preloadFeatureCollections
   * Maintains compatibility with existing API while also preloading images.
   */
  preloadFeatureCollections() {
    this.preloadContent();
  }

  /**
   * ### preloadContent
   * Preload both map data and images as appropriate
   */
  preloadContent() {
    for (const slide of this.slides) {
      if (this.isMapSlide(slide)) {
        // Preload map data
        this.getSlideFeatureCollection(slide);
      } else if (this.isImageSlide(slide)) {
        // Preload images
        const imageSrc = this.getSlideImageSrc(slide);
        const img = new Image();
        img.src = imageSrc;
      }
    }
  }

  /**
   * Calculate the current slide index based on the current scroll position.
   */
  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY - this.container.offsetTop;
    const windowHeight = window.innerHeight;

    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos =
          this.slides[i].offsetTop - scrollPos + windowHeight/10;
      if (slidePos >= 0) {
        break;
      }
    }

    if (i !== this.currentSlideIndex) {
      this.currentSlideIndex = i;
      this.syncToSlide(this.slides[i]);
    }
  }
}

export { SlideDeck };