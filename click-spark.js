// Click Spark Effect
class ClickSparkEffect {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      sparkColor: '#f77c00',
      sparkSize: 10,
      sparkRadius: 15,
      sparkCount: 8,
      duration: 400,
      easing: 'ease-out',
      extraScale: 1.0,
      ...options
    };
    
    this.canvas = null;
    this.ctx = null;
    this.sparks = [];
    this.animationId = null;
    
    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    
    // Make element relative positioned
    const computedStyle = window.getComputedStyle(this.element);
    if (computedStyle.position === 'static') {
      this.element.style.position = 'relative';
    }
    
    // Add canvas to element
    this.element.appendChild(this.canvas);
    
    // Get context
    this.ctx = this.canvas.getContext('2d');
    
    // Setup resize observer
    this.setupResizeObserver();
    
    // Setup click handler
    this.setupClickHandler();
    
    // Start animation
    this.startAnimation();
  }

  setupResizeObserver() {
    const resizeCanvas = () => {
      const rect = this.element.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(this.element);
    resizeCanvas();
  }

  setupClickHandler() {
    this.element.addEventListener('click', (e) => {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.createSparks(x, y);
    });
  }

  createSparks(x, y) {
    const now = performance.now();
    const newSparks = Array.from({ length: this.options.sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / this.options.sparkCount,
      startTime: now
    }));
    
    this.sparks.push(...newSparks);
  }

  easeFunc(t) {
    switch (this.options.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t);
    }
  }

  startAnimation() {
    const animate = (timestamp) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.sparks = this.sparks.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= this.options.duration) {
          return false;
        }
        
        const progress = elapsed / this.options.duration;
        const eased = this.easeFunc(progress);
        
        const distance = eased * this.options.sparkRadius * this.options.extraScale;
        const lineLength = this.options.sparkSize * (1 - eased);
        
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
        
        this.ctx.strokeStyle = this.options.sparkColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        return true;
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Initialize click spark effects when DOM is loaded
function initializeClickSparkEffects() {
  console.log('ClickSpark: Initializing effects...');
  
  // Add spark effect to service cards
  const serviceCards = document.querySelectorAll('.service-card');
  console.log('ClickSpark: Found', serviceCards.length, 'service cards');
  serviceCards.forEach(card => {
    new ClickSparkEffect(card, {
      sparkColor: '#f77c00',
      sparkSize: 8,
      sparkRadius: 20,
      sparkCount: 6,
      duration: 500
    });
  });
  
  // Add spark effect to buttons
  const buttons = document.querySelectorAll('button, .btn-login, .btn-register, .btn-profile, .btn-share, .btn-edit-profile, .btn-add-service, .btn-edit, .btn-deactivate, .btn-save, .btn-danger');
  console.log('ClickSpark: Found', buttons.length, 'buttons');
  buttons.forEach(button => {
    new ClickSparkEffect(button, {
      sparkColor: '#f77c00',
      sparkSize: 6,
      sparkRadius: 15,
      sparkCount: 4,
      duration: 400
    });
  });
  
  // Add spark effect to navigation links
  const navLinks = document.querySelectorAll('.nav-link, .tab-link');
  console.log('ClickSpark: Found', navLinks.length, 'nav links');
  navLinks.forEach(link => {
    new ClickSparkEffect(link, {
      sparkColor: '#f77c00',
      sparkSize: 5,
      sparkRadius: 12,
      sparkCount: 4,
      duration: 350
    });
  });
  
  // Add spark effect to quick action buttons
  const quickActions = document.querySelectorAll('.quick-action-btn');
  console.log('ClickSpark: Found', quickActions.length, 'quick actions');
  quickActions.forEach(button => {
    new ClickSparkEffect(button, {
      sparkColor: '#f77c00',
      sparkSize: 7,
      sparkRadius: 18,
      sparkCount: 5,
      duration: 450
    });
  });
  
  // Add spark effect to stat cards
  const statCards = document.querySelectorAll('.stat-card');
  console.log('ClickSpark: Found', statCards.length, 'stat cards');
  statCards.forEach(card => {
    new ClickSparkEffect(card, {
      sparkColor: '#f77c00',
      sparkSize: 6,
      sparkRadius: 15,
      sparkCount: 4,
      duration: 400
    });
  });
  
  // Add spark effect to content sections
  const contentSections = document.querySelectorAll('.content-section, .settings-section');
  console.log('ClickSpark: Found', contentSections.length, 'content sections');
  contentSections.forEach(section => {
    new ClickSparkEffect(section, {
      sparkColor: '#f77c00',
      sparkSize: 5,
      sparkRadius: 12,
      sparkCount: 3,
      duration: 350
    });
  });
  
  console.log('ClickSpark: All effects initialized!');
}

// Try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClickSparkEffects);
} else {
  // DOM is already loaded, initialize immediately
  initializeClickSparkEffects();
}
