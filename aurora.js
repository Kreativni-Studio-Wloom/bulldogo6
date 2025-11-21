// Aurora Background Effect
class AuroraBackground {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.mesh = null;
    this.animationId = null;
    this.isRunning = false;
    
    this.config = {
      colorStops: ['#FFD700', '#FFD700', '#FFD700'],
      blend: 1.0,
      amplitude: 1.5,
      speed: 0.5
    };
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.initWebGL();
    this.createShaderProgram();
    this.createGeometry();
    this.start();
    
    window.addEventListener('resize', () => this.resize());
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    this.canvas.style.opacity = '1.0';
    this.canvas.style.mixBlendMode = 'screen';
    this.container.appendChild(this.canvas);
  }

  initWebGL() {
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    
    if (!this.gl) {
      console.error('WebGL2 not supported');
      return;
    }
    
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.enable(this.gl.BLEND);
    // Additive blending prevents any darkening/grey tint on white background
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
  }

  createShaderProgram() {
    const vertShader = `#version 300 es
      in vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragShader = `#version 300 es
      precision highp float;

      uniform float uTime;
      uniform float uAmplitude;
      uniform vec3 uColorStops[3];
      uniform vec2 uResolution;
      uniform float uBlend;

      out vec4 fragColor;

      vec3 permute(vec3 x) {
        return mod(((x * 34.0) + 1.0) * x, 289.0);
      }

      float snoise(vec2 v){
        const vec4 C = vec4(
            0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439
        );
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);

        vec3 p = permute(
            permute(i.y + vec3(0.0, i1.y, 1.0))
          + i.x + vec3(0.0, i1.x, 1.0)
        );

        vec3 m = max(
            0.5 - vec3(
                dot(x0, x0),
                dot(x12.xy, x12.xy),
                dot(x12.zw, x12.zw)
            ), 
            0.0
        );
        m = m * m;
        m = m * m;

        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      struct ColorStop {
        vec3 color;
        float position;
      };

      #define COLOR_RAMP(colors, factor, finalColor) {              \\
        int index = 0;                                            \\
        for (int i = 0; i < 2; i++) {                               \\
           ColorStop currentColor = colors[i];                    \\
           bool isInBetween = currentColor.position <= factor;    \\
           index = int(mix(float(index), float(i), float(isInBetween))); \\
        }                                                         \\
        ColorStop currentColor = colors[index];                   \\
        ColorStop nextColor = colors[index + 1];                  \\
        float range = nextColor.position - currentColor.position; \\
        float lerpFactor = (factor - currentColor.position) / range; \\
        finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        
        ColorStop colors[3];
        colors[0] = ColorStop(uColorStops[0], 0.0);
        colors[1] = ColorStop(uColorStops[1], 0.5);
        colors[2] = ColorStop(uColorStops[2], 1.0);
        
        vec3 rampColor;
        COLOR_RAMP(colors, uv.x, rampColor);
        
        float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
        height = exp(height);
        height = (uv.y * 2.0 - height + 0.2);
        float intensity = 0.6 * height;
        
        float midPoint = 0.20;
        float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
        
        vec3 auroraColor = intensity * rampColor;
        
        fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
      }
    `;

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertShader);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragShader);

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Shader program failed to link:', this.gl.getProgramInfoLog(this.program));
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createGeometry() {
    // Create triangle geometry
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      1, 3, 2
    ]);

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

    // Get attribute locations
    this.positionLocation = this.gl.getAttribLocation(this.program, 'position');
    
    // Get uniform locations
    this.timeLocation = this.gl.getUniformLocation(this.program, 'uTime');
    this.amplitudeLocation = this.gl.getUniformLocation(this.program, 'uAmplitude');
    this.colorStopsLocation = this.gl.getUniformLocation(this.program, 'uColorStops');
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'uResolution');
    this.blendLocation = this.gl.getUniformLocation(this.program, 'uBlend');
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0];
  }

  animate() {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = performance.now() * 0.001;
    
    this.gl.useProgram(this.program);
    
    // Set uniforms
    this.gl.uniform1f(this.timeLocation, time * this.config.speed);
    this.gl.uniform1f(this.amplitudeLocation, this.config.amplitude);
    this.gl.uniform1f(this.blendLocation, this.config.blend);
    this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    
    // Set color stops
    const colorStops = this.config.colorStops.map(hex => this.hexToRgb(hex));
    this.gl.uniform3fv(this.colorStopsLocation, colorStops.flat());
    
    // Set up geometry
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    this.isRunning = true;
    this.resize();
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', () => this.resize());
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    if (this.gl) {
      this.gl.deleteProgram(this.program);
      this.gl.deleteBuffer(this.vertexBuffer);
      this.gl.deleteBuffer(this.indexBuffer);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const heroSection = document.querySelector('.hero');
  // Init aurora only when explicitly enabled via data attribute
  if (heroSection && heroSection.dataset.aurora === 'true') {
    const auroraConfig = {
      colorStops: ['#FFF4C4', '#FFE79A', '#FFE089'],
      blend: 0.9,
      amplitude: 2.0,
      speed: 0.8
    };
    window.auroraBackground = new AuroraBackground(heroSection);
    window.auroraBackground.updateConfig(auroraConfig);
  }
});
