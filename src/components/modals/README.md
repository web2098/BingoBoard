# Modal Components

This directory contains three reusable modal components that can be used across different pages in the application.

## Components

### 1. TextModal
A modal that displays text over a semi-transparent black background with a configurable timeout.

**Props:**
- `isVisible: boolean` - Controls modal visibility
- `text: string` - Text to display
- `timeout?: number` - Auto-close timeout in milliseconds (default: 3000)
- `onClose: () => void` - Callback when modal closes
- `fontSize?: 'small' | 'medium' | 'large' | 'xlarge'` - Text size (default: 'large')
- `textColor?: string` - Text color (default: '#ffffff')

**Usage:**
```tsx
import { TextModal } from '../components/modals';

<TextModal
  isVisible={showModal}
  text="APPLAUSE!"
  timeout={3000}
  onClose={() => setShowModal(false)}
  fontSize="xlarge"
/>
```

### 2. ImageModal
A modal that displays an image over the entire page. Closes when clicked or when a specified shortcut key is pressed.

**Props:**
- `isVisible: boolean` - Controls modal visibility
- `imageSrc: string` - Source URL for the image
- `alt?: string` - Alt text for the image (default: 'Modal Image')
- `onClose: () => void` - Callback when modal closes
- `closeOnShortcut?: string` - Keyboard shortcut to close (e.g., 'x', 'Escape')

**Usage:**
```tsx
import { ImageModal } from '../components/modals';

<ImageModal
  isVisible={showModal}
  imageSrc={battleImage}
  alt="Battle to the Death"
  onClose={() => setShowModal(false)}
  closeOnShortcut="x"
/>
```

### 3. AnimatedModal
A modal that displays an animated GIF with optional audio over a semi-transparent background. The GIF takes up 90% of the space and closes when audio ends or timeout is reached.

**Props:**
- `isVisible: boolean` - Controls modal visibility
- `imageSrc: string` - Source URL for the animated GIF
- `audioSrc?: string` - Optional audio source URL
- `alt?: string` - Alt text for the image (default: 'Animated Modal')
- `timeout?: number` - Fallback timeout in milliseconds (default: 5000)
- `onClose: () => void` - Callback when modal closes
- `autoPlay?: boolean` - Whether audio should auto-play (default: true)

**Usage:**
```tsx
import { AnimatedModal } from '../components/modals';

<AnimatedModal
  isVisible={showModal}
  imageSrc={order66Gif}
  audioSrc={order66Audio}
  alt="Execute Order 66"
  timeout={6000}
  onClose={() => setShowModal(false)}
  autoPlay={true}
/>
```

## Features

### Common Features (All Modals)
- **Full-screen overlay** with semi-transparent background
- **Body scroll prevention** when modal is open
- **High z-index** (9999) to appear above other content
- **Responsive design** that works on mobile and desktop
- **Accessibility support** with proper ARIA handling

### TextModal Specific
- **Configurable font sizes** with responsive breakpoints
- **Custom text colors** and styling
- **Automatic timeout** with cleanup
- **Click-to-close** functionality

### ImageModal Specific
- **Keyboard shortcuts** for closing (custom + Escape)
- **Click-to-close** on image or overlay
- **Image optimization** with proper scaling
- **Visual close hints** for better UX

### AnimatedModal Specific
- **Audio synchronization** - closes when audio ends
- **Fallback timeout** if no audio or audio fails
- **Progress indicator** showing remaining time
- **Audio error handling** with graceful fallbacks
- **Auto-play support** with error handling

## Styling

Each component has its own CSS file with:
- **Responsive breakpoints** for mobile, tablet, and desktop
- **High contrast mode** support
- **Smooth animations** and transitions
- **Consistent visual design** across all modals

## Integration with Audience Interactions

These modals are designed to work with the audience interaction system:

```tsx
// Example integration in settings or game pages
const showAudienceInteraction = (interactionType: string) => {
  const interaction = audienceInteractions.find(i => i.id === interactionType);

  if (interaction.content.text && !interaction.content.img) {
    // Use TextModal for text-only interactions
    setTextModalConfig({
      text: interaction.content.text,
      timeout: 3000
    });
    setTextModalVisible(true);
  } else if (interaction.content.img && !interaction.content.audio) {
    // Use ImageModal for image-only interactions
    setImageModalConfig({
      imageSrc: interaction.content.img,
      closeOnShortcut: interaction.shortcuts?.[0]
    });
    setImageModalVisible(true);
  } else if (interaction.content.img && interaction.content.audio) {
    // Use AnimatedModal for image + audio interactions
    setAnimatedModalConfig({
      imageSrc: interaction.content.img,
      audioSrc: interaction.content.audio,
      timeout: 6000
    });
    setAnimatedModalVisible(true);
  }
};
```

## Browser Compatibility

- **Modern browsers** with ES6+ support
- **Audio support** for MP3, OGG, WAV formats
- **Image support** for JPG, PNG, GIF, WebP formats
- **Mobile browsers** with touch support
