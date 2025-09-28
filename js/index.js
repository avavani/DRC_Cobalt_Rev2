import { SlideDeck } from './slidedeck.js';

const map = L.map('map', {scrollWheelZoom: false}).setView([0, 0], 5);
const Mapboxkey = 'pk.eyJ1IjoiYWF2YW5pMTAzIiwiYSI6ImNtMTgxOGkyZzBvYnQyam16bXFydTUwM3QifQ.hXw8FwWysnOw3It_Sms3UQ';
const Mapboxstyle = 'mapbox/dark-v11';

// ## The Base Tile Layer
const baseTileLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/${Mapboxstyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${Mapboxkey}`, {
  maxZoom: 16,
});

baseTileLayer.addTo(map);

// / ## Interface Elements
const container = document.querySelector('.slide-section');
const slides = document.querySelectorAll('.slide');

// ## The SlideDeck object
const deck = new SlideDeck(container, slides, map);

document.addEventListener('scroll', () => deck.calcCurrentSlideIndex());

deck.preloadFeatureCollections();
deck.syncToCurrentSlide();