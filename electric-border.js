// Electric Border Effect
class ElectricBorder {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      color: '#5227FF',
      speed: 1,
      chaos: 1,
      thickness: 2,
      ...options
    };
    
    this.filterId = `turbulent-displace-${Math.random().toString(36).substr(2, 9)}`;
    this.svg = null;
    this.stroke = null;
    this.animations = [];
    
    this.init();
  }

  init() {
    // Create SVG filter
    this.createSVGFilter();
    
    // Create border layers
    this.createBorderLayers();
    
    // Setup resize observer
    this.setupResizeObserver();
    
    // Start animations
    this.startAnimations();
  }

  createSVGFilter() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'eb-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', this.filterId);
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');

    // Create turbulence effects
    this.createTurbulenceEffect(filter, 'noise1', '1');
    this.createTurbulenceEffect(filter, 'noise2', '1');
    this.createTurbulenceEffect(filter, 'noise3', '2');
    this.createTurbulenceEffect(filter, 'noise4', '2');

    // Create displacement map
    const displacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    displacementMap.setAttribute('in', 'SourceGraphic');
    displacementMap.setAttribute('in2', 'combinedNoise');
    displacementMap.setAttribute('scale', String(30 * this.options.chaos));
    displacementMap.setAttribute('xChannelSelector', 'R');
    displacementMap.setAttribute('yChannelSelector', 'B');

    filter.appendChild(displacementMap);
    defs.appendChild(filter);
    svg.appendChild(defs);

    this.element.appendChild(svg);
    this.svg = svg;
  }

  createTurbulenceEffect(filter, result, seed) {
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('type', 'turbulence');
    turbulence.setAttribute('baseFrequency', '0.02');
    turbulence.setAttribute('numOctaves', '10');
    turbulence.setAttribute('result', result);
    turbulence.setAttribute('seed', seed);

    const offset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
    offset.setAttribute('in', result);
    offset.setAttribute('dx', '0');
    offset.setAttribute('dy', '0');
    offset.setAttribute('result', `offset${result}`);

    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', seed === '1' ? 'dy' : 'dx');
    animate.setAttribute('values', seed === '1' ? '700; 0' : '490; 0');
    animate.setAttribute('dur', `${6 / this.options.speed}s`);
    animate.setAttribute('repeatCount', 'indefinite');
    animate.setAttribute('calcMode', 'linear');

    offset.appendChild(animate);
    filter.appendChild(turbulence);
    filter.appendChild(offset);
  }

  createBorderLayers() {
    const layers = document.createElement('div');
    layers.className = 'eb-layers';

    // Stroke layer
    const stroke = document.createElement('div');
    stroke.className = 'eb-stroke';
    stroke.style.filter = `url(#${this.filterId})`;
    this.stroke = stroke;

    // Glow layers
    const glow1 = document.createElement('div');
    glow1.className = 'eb-glow-1';

    const glow2 = document.createElement('div');
    glow2.className = 'eb-glow-2';

    const backgroundGlow = document.createElement('div');
    backgroundGlow.className = 'eb-background-glow';

    layers.appendChild(stroke);
    layers.appendChild(glow1);
    layers.appendChild(glow2);
    layers.appendChild(backgroundGlow);

    this.element.appendChild(layers);
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this.updateAnimations();
    });

    resizeObserver.observe(this.element);
    this.updateAnimations();
  }

  updateAnimations() {
    if (!this.svg) return;

    const rect = this.element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const animations = this.svg.querySelectorAll('animate');
    animations.forEach((anim, index) => {
      if (index < 2) {
        // dy animations
        anim.setAttribute('values', index === 0 ? `${height}; 0` : `0; -${height}`);
      } else {
        // dx animations
        anim.setAttribute('values', index === 2 ? `${width}; 0` : `0; -${width}`);
      }
      
      const dur = 6 / this.options.speed;
      anim.setAttribute('dur', `${dur}s`);
    });

    const displacementMap = this.svg.querySelector('feDisplacementMap');
    if (displacementMap) {
      displacementMap.setAttribute('scale', String(30 * this.options.chaos));
    }
  }

  startAnimations() {
    const animations = this.svg.querySelectorAll('animate');
    animations.forEach(anim => {
      if (typeof anim.beginElement === 'function') {
        try {
          anim.beginElement();
        } catch (e) {
          console.warn('ElectricBorder: beginElement failed', e);
        }
      }
    });
  }

  destroy() {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }
    
    const layers = this.element.querySelector('.eb-layers');
    if (layers && layers.parentNode) {
      layers.parentNode.removeChild(layers);
    }
  }
}

// Initialize featured ad with electric border
document.addEventListener('DOMContentLoaded', function() {
  const featuredServiceWithBorder = document.querySelector('.featured-service.electric-border');
  if (featuredServiceWithBorder) {
    new ElectricBorder(featuredServiceWithBorder, {
      color: '#00BFFF',
      speed: 1.5,
      chaos: 1.2,
      thickness: 3
    });
  }
});
