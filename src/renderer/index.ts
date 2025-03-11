// Make this a module
export {};

// Proper way to augment Window interface in TypeScript
interface Window {
  electronAPI?: {
    getScreenSize: () => Promise<{ width: number, height: number }>;
  }
}

// Type definitions for our sprite and animation system
enum Direction {
  LEFT,
  RIGHT
}

enum AnimationState {
  IDLE,
  WALKING,
  START_WALKING,
  STOP_WALKING
}

interface SpritePosition {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

interface SpriteAnimation {
  frames: string[];
  frameDuration: number; // in milliseconds
}

interface SpriteAnimations {
  idleLeft: SpriteAnimation;
  idleRight: SpriteAnimation;
  walkLeft: SpriteAnimation;
  walkRight: SpriteAnimation;
  startWalkLeft: SpriteAnimation;
  startWalkRight: SpriteAnimation;
  stopWalkLeft: SpriteAnimation;
  stopWalkRight: SpriteAnimation;
}

// Update animations with the SVG sprite paths
const animations: SpriteAnimations = {
  idleLeft: {
    frames: [
      '../assets/chicken-idle-left-1.svg',
      '../assets/chicken-idle-left-2.svg',
      '../assets/chicken-idle-left-3.svg',
      '../assets/chicken-idle-left-4.svg'
    ],
    frameDuration: 250
  },
  idleRight: {
    frames: [
      '../assets/chicken-idle-right-1.svg',
      '../assets/chicken-idle-right-2.svg',
      '../assets/chicken-idle-right-3.svg',
      '../assets/chicken-idle-right-4.svg'
    ],
    frameDuration: 250
  },
  walkLeft: {
    frames: [
      '../assets/chicken-walk-left-1.svg',
      '../assets/chicken-walk-left-2.svg',
      '../assets/chicken-walk-left-3.svg',
      '../assets/chicken-walk-left-4.svg'
    ],
    frameDuration: 125
  },
  walkRight: {
    frames: [
      '../assets/chicken-walk-right-1.svg',
      '../assets/chicken-walk-right-2.svg',
      '../assets/chicken-walk-right-3.svg',
      '../assets/chicken-walk-right-4.svg'
    ],
    frameDuration: 125
  },
  startWalkLeft: {
    frames: [
      '../assets/chicken-start-left-1.svg',
      '../assets/chicken-start-left-2.svg'
    ],
    frameDuration: 100
  },
  startWalkRight: {
    frames: [
      '../assets/chicken-start-right-1.svg',
      '../assets/chicken-start-right-2.svg'
    ],
    frameDuration: 100
  },
  stopWalkLeft: {
    frames: [
      '../assets/chicken-start-left-2.svg',
      '../assets/chicken-start-left-1.svg'
    ],
    frameDuration: 100
  },
  stopWalkRight: {
    frames: [
      '../assets/chicken-start-right-2.svg',
      '../assets/chicken-start-right-1.svg'
    ],
    frameDuration: 100
  }
};

// Sprite animation controller
class SpriteController {
  private spriteElement: HTMLImageElement;
  private containerElement: HTMLElement;
  private currentAnimation: SpriteAnimation;
  private currentFrame: number = 0;
  private animationInterval: number | null = null;
  private position: SpritePosition = { x: 0, y: 0 };
  private targetPosition: SpritePosition = { x: 0, y: 0 };
  private velocity: SpritePosition = { x: 0, y: 0 };
  private direction: Direction = Direction.RIGHT;
  private state: AnimationState = AnimationState.IDLE;
  private idleTimer: number | null = null;
  private lastMousePosition: MousePosition = { x: 0, y: 0 };
  private idleTimeout: number = 5000; // 5 seconds of no movement enters autonomous mode
  private isAutonomous: boolean = false;
  private autonomousTargetPosition: SpritePosition | null = null;
  private spriteWidth: number = 32; // Half the original size (64px -> 32px)
  private spriteHeight: number = 32; // Half the original size (64px -> 32px)
  
  constructor() {
    this.spriteElement = document.getElementById('sprite') as HTMLImageElement;
    this.containerElement = document.getElementById('sprite-container') as HTMLElement;
    this.currentAnimation = animations.idleRight;
    
    // Set initial position to center of screen
    this.position = {
      x: window.innerWidth / 2 - this.spriteWidth / 2,
      y: window.innerHeight / 2 - this.spriteHeight / 2
    };
    this.targetPosition = { ...this.position };
    
    // Start the animation loop
    this.startAnimation(animations.idleRight);
    this.updatePosition();
    
    // Set up event listeners for mouse movement and window resize
    this.setupEventListeners();
    
    // Start update loop immediately
    this.startUpdateLoop();
    
    console.log('Sprite controller initialized');
  }
  
  private setupEventListeners() {
    // Capture mouse movement events - use document for broader coverage
    document.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    
    // Try window mousemove as well for redundancy
    window.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    
    // Also listen for pointermove for touch/pen devices
    document.addEventListener('pointermove', this.onMouseMove.bind(this), true);
    
    // Make entire document clickable to move sprite there - this helps with tracking issues
    document.addEventListener('click', (e) => {
      console.log('Click detected at:', e.clientX, e.clientY);
      this.handleMouseMove(e.clientX, e.clientY);
      
      // Add immediate positioning with click to improve responsiveness
      this.position = {
        x: e.clientX - this.spriteWidth / 2,
        y: e.clientY + 10
      };
      this.updatePosition();
    });
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      // Adjust position if needed when window size changes
      this.updatePosition();
    });
    
    // Log debug info to console every few seconds to help diagnose issues
    setInterval(() => {
      console.log('Debug: Mouse position =', this.lastMousePosition, 
                  '| Sprite position =', this.position, 
                  '| Target position =', this.targetPosition);
    }, 3000);
  }
  
  private onMouseMove(e: MouseEvent | PointerEvent) {
    // Use requestAnimationFrame to avoid too many updates
    requestAnimationFrame(() => {
      this.handleMouseMove(e.clientX, e.clientY);
    });
  }
  
  private startUpdateLoop() {
    const updateFn = () => {
      this.update();
      requestAnimationFrame(updateFn);
    };
    updateFn(); // Start the loop immediately
  }
  
  private handleMouseMove(x: number, y: number) {
    // Update mouse position
    this.lastMousePosition = { x, y };
    
    // Reset idle timer and exit autonomous mode
    if (this.isAutonomous) {
      this.exitAutonomousMode();
    }
    
    // Reset the idle timer
    this.resetIdleTimer();
    
    // Update target position (offset to place sprite below cursor)
    this.targetPosition = {
      x: x - this.spriteWidth / 2,
      y: y + 10 // Smaller offset below cursor since the sprite is smaller
    };
    
    // Update direction based on target position
    if (this.targetPosition.x < this.position.x - 5) {
      this.setDirection(Direction.LEFT);
    } else if (this.targetPosition.x > this.position.x + 5) {
      this.setDirection(Direction.RIGHT);
    }
    
    // Update state if needed
    const distance = Math.sqrt(
      Math.pow(this.targetPosition.x - this.position.x, 2) + 
      Math.pow(this.targetPosition.y - this.position.y, 2)
    );
    
    if (distance > 5) {
      if (this.state === AnimationState.IDLE) {
        this.setState(AnimationState.START_WALKING);
      }
    } else {
      if (this.state === AnimationState.WALKING) {
        this.setState(AnimationState.STOP_WALKING);
      }
    }
  }
  
  private resetIdleTimer() {
    // Clear existing timer
    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer as number);
    }
    
    // Set new timer
    this.idleTimer = window.setTimeout(() => {
      this.enterAutonomousMode();
    }, this.idleTimeout);
  }
  
  private enterAutonomousMode() {
    this.isAutonomous = true;
    this.generateRandomTarget();
  }
  
  private exitAutonomousMode() {
    this.isAutonomous = false;
    this.autonomousTargetPosition = null;
  }
  
  private generateRandomTarget() {
    if (!this.isAutonomous) return;
    
    // Generate a random position on screen
    const maxX = window.innerWidth - this.spriteWidth;
    const maxY = window.innerHeight - this.spriteHeight;
    
    this.autonomousTargetPosition = {
      x: Math.random() * maxX,
      y: Math.random() * maxY
    };
    
    // Update direction and state
    if (this.autonomousTargetPosition.x < this.position.x) {
      this.setDirection(Direction.LEFT);
    } else {
      this.setDirection(Direction.RIGHT);
    }
    
    this.setState(AnimationState.START_WALKING);
    
    // Set timer for next random target
    window.setTimeout(() => {
      if (this.isAutonomous) {
        this.generateRandomTarget();
      }
    }, Math.random() * 5000 + 3000); // Between 3-8 seconds
  }
  
  private update() {
    if (this.isAutonomous && this.autonomousTargetPosition) {
      // Move toward autonomous target
      this.targetPosition = this.autonomousTargetPosition;
    }
    
    // Calculate the distance between current position and target
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only move if we're not very close to target
    if (distance > 2) { // Reduced threshold for closer following
      // Calculate velocity with less easing for more responsive movement
      this.velocity.x = this.velocity.x * 0.85 + dx * 0.15; // More responsive
      this.velocity.y = this.velocity.y * 0.85 + dy * 0.15; // More responsive
      
      // Apply velocity to position with increased speed
      this.position.x += this.velocity.x * 0.15; // Increased speed
      this.position.y += this.velocity.y * 0.15; // Increased speed
      
      // If we're in idle state, start walking
      if (this.state === AnimationState.IDLE && distance > 5) {
        this.setState(AnimationState.START_WALKING);
      }
    } else {
      // We're close enough to target, so stop
      this.velocity = { x: 0, y: 0 };
      
      // If we're walking, stop walking
      if (this.state === AnimationState.WALKING) {
        this.setState(AnimationState.STOP_WALKING);
      }
      
      // If in autonomous mode and at target, generate new target
      if (this.isAutonomous && distance < 5) {
        this.generateRandomTarget();
      }
    }
    
    // Update the visible position
    this.updatePosition();
  }
  
  private updatePosition() {
    // Update the sprite container position
    this.containerElement.style.left = `${this.position.x}px`;
    this.containerElement.style.top = `${this.position.y}px`;
  }
  
  private setDirection(direction: Direction) {
    if (direction === this.direction) return;
    
    this.direction = direction;
    
    // Update animation based on direction and state
    this.updateAnimationState();
  }
  
  private setState(state: AnimationState) {
    if (state === this.state) return;
    
    this.state = state;
    
    // Handle state transitions
    switch (state) {
      case AnimationState.START_WALKING:
        // Play start walking animation, then transition to walking
        this.playTransitionAnimation(
          this.direction === Direction.LEFT ? animations.startWalkLeft : animations.startWalkRight,
          AnimationState.WALKING
        );
        break;
        
      case AnimationState.WALKING:
        // Start walking animation
        this.startAnimation(
          this.direction === Direction.LEFT ? animations.walkLeft : animations.walkRight
        );
        break;
        
      case AnimationState.STOP_WALKING:
        // Play stop walking animation, then transition to idle
        this.playTransitionAnimation(
          this.direction === Direction.LEFT ? animations.stopWalkLeft : animations.stopWalkRight,
          AnimationState.IDLE
        );
        break;
        
      case AnimationState.IDLE:
        // Start idle animation
        this.startAnimation(
          this.direction === Direction.LEFT ? animations.idleLeft : animations.idleRight
        );
        break;
    }
  }
  
  private updateAnimationState() {
    // Update animation based on current state and direction
    switch (this.state) {
      case AnimationState.IDLE:
        this.startAnimation(
          this.direction === Direction.LEFT ? animations.idleLeft : animations.idleRight
        );
        break;
        
      case AnimationState.WALKING:
        this.startAnimation(
          this.direction === Direction.LEFT ? animations.walkLeft : animations.walkRight
        );
        break;
        
      // For transitional states, we don't change the animation mid-transition
    }
  }
  
  private startAnimation(animation: SpriteAnimation) {
    // Stop current animation if it exists
    if (this.animationInterval !== null) {
      window.clearInterval(this.animationInterval as number);
    }
    
    // Set the new animation and reset frame
    this.currentAnimation = animation;
    this.currentFrame = 0;
    
    // Update the sprite image
    this.updateSpriteImage();
    
    // Start the animation interval
    this.animationInterval = window.setInterval(() => {
      // Increment frame and loop back to 0 when reaching the end
      this.currentFrame = (this.currentFrame + 1) % this.currentAnimation.frames.length;
      this.updateSpriteImage();
    }, this.currentAnimation.frameDuration);
  }
  
  private playTransitionAnimation(animation: SpriteAnimation, nextState: AnimationState) {
    // Stop current animation if it exists
    if (this.animationInterval !== null) {
      window.clearInterval(this.animationInterval as number);
    }
    
    // Set the transition animation and reset frame
    this.currentAnimation = animation;
    this.currentFrame = 0;
    
    // Update the sprite image
    this.updateSpriteImage();
    
    // For transition animations, we play through once and then change state
    let frameCount = 0;
    
    this.animationInterval = window.setInterval(() => {
      frameCount++;
      
      if (frameCount >= this.currentAnimation.frames.length) {
        // Transition animation complete, move to next state
        window.clearInterval(this.animationInterval as number);
        this.animationInterval = null;
        this.state = nextState; // Set state directly to avoid recursion
        
        // Start the next animation
        this.updateAnimationState();
      } else {
        // Continue the transition animation
        this.currentFrame = frameCount;
        this.updateSpriteImage();
      }
    }, this.currentAnimation.frameDuration);
  }
  
  private updateSpriteImage() {
    // Set the sprite image to the current frame
    const frameUrl = this.currentAnimation.frames[this.currentFrame];
    this.spriteElement.src = frameUrl;
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the sprite controller
  const spriteController = new SpriteController();
}); 