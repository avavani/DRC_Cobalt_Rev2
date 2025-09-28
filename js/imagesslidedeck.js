/**
 * An image slide deck object
 */
class ImageSlideDeck {
  /**
   * Constructor for the ImageSlideDeck object.
   * @param {Node} container The container element for the slides.
   * @param {NodeList} slides A list of HTML elements containing the slide text.
   * @param {HTMLImageElement} imageElement The image element where photos will be displayed.
   */
  constructor(container, slides, imageElement) {
    this.container = container;
    this.slides = slides;
    this.imageElement = imageElement;
    this.currentSlideIndex = 0;

    // Set up image element styling
    this.setupImageElement();
  }

  /**
   * ### setupImageElement
   * 
   * Configure the image element with appropriate styling
   */
  setupImageElement() {
    this.imageElement.style.transition = 'opacity 0.3s ease-in-out';
    this.imageElement.style.objectFit = 'cover';
    this.imageElement.style.width = '100%';
    this.imageElement.style.height = '100%';
  }

  /**
   * ### updateImage
   *
   * Update the displayed image with the image for the current slide.
   * 
   * @param {string} imageSrc The source URL for the new image
   */
  updateImage(imageSrc) {
    if (!imageSrc) return;

    // Fade out current image
    this.imageElement.style.opacity = '0.3';
    
    // Load new image
    const img = new Image();
    img.onload = () => {
      this.imageElement.src = imageSrc;
      this.imageElement.style.opacity = '1';
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${imageSrc}`);
      this.imageElement.style.opacity = '1';
    };
    img.src = imageSrc;
  }

  /**
   * ### getSlideImageSrc
   *
   * Get the image source for a slide based on its ID and format.
   *
   * @param {HTMLElement} slide The slide's HTML element
   * @return {string} The image source path
   */
  getSlideImageSrc(slide) {
    const imageId = slide.id;
    const format = slide.dataset.format || 'jpg';
    return `../img/${imageId}.${format}`;
  }

  /**
   * ### hideAllSlides
   *
   * Add the hidden class to all slides' HTML elements.
   */
  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }
  }

  /**
   * ### syncImageToSlide
   *
   * Update the image to match the specified slide.
   *
   * @param {HTMLElement} slide The slide's HTML element
   */
  syncImageToSlide(slide) {
    const imageSrc = this.getSlideImageSrc(slide);
    this.updateImage(imageSrc);
  }

  /**
   * Show the image for the slide matched by currentSlideIndex.
   */
  syncImageToCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.syncImageToSlide(slide);
  }

  /**
   * Increment the currentSlideIndex and show the corresponding image.
   * If the current slide is the final slide, then the next is the first.
   */
  goNextSlide() {
    this.currentSlideIndex++;

    if (this.currentSlideIndex === this.slides.length) {
      this.currentSlideIndex = 0;
    }

    this.syncImageToCurrentSlide();
  }

  /**
   * Decrement the currentSlideIndex and show the corresponding image.
   * If the current slide is the first slide, then the previous is the final.
   */
  goPrevSlide() {
    this.currentSlideIndex--;

    if (this.currentSlideIndex < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    }

    this.syncImageToCurrentSlide();
  }

  /**
   * ### preloadImages
   *
   * Initiate loading on all slide images so that the browser can cache them.
   * This way, when a specific slide is shown it loads quickly.
   */
  preloadImages() {
    for (const slide of this.slides) {
      const imageSrc = this.getSlideImageSrc(slide);
      const img = new Image();
      img.src = imageSrc;
    }
  }

  /**
   * Calculate the current slide index based on the current scroll position.
   * This mirrors the same method in SlideDeck for consistency.
   */
  calcCurrentSlideIndex() {
    const scrollPos = window.scrollY - this.container.offsetTop;
    const windowHeight = window.innerHeight;

    let i;
    for (i = 0; i < this.slides.length; i++) {
      const slidePos =
          this.slides[i].offsetTop - scrollPos + windowHeight * 0.7;
      if (slidePos >= 0) {
        break;
      }
    }

    if (i !== this.currentSlideIndex) {
      this.currentSlideIndex = i;
      this.syncImageToCurrentSlide();
    }
  }
}

export { ImageSlideDeck };