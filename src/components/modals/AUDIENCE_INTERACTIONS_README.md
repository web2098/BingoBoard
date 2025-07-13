# Audience Interactions Implementation

This document describes the implementation of the three types of audience interactions as specified in the requirements.

## Overview

Three types of audience interactions have been implemented:

1. **Flash Message** - Timed messages with countdown and customizable styling (replaces TextModal)
2. **Popup Message** - Text or image content that requires user interaction to close
3. **Video Message** - GIF with audio that auto-closes when audio finishes

## Components

### FlashModal (`src/components/modals/FlashModal.tsx`) - Primary Text Display

**Features:**
- ✅ Shows up for a configurable timeout (default: 5 seconds)
- ✅ Clicking does NOT disable the timeout
- ✅ Countdown timer at top right with circular progress indicator
- ✅ Text message displayed in the middle of the page
- ✅ Customizable rectangle background color (default: #F5F0B9)
- ✅ Customizable border color (default: #307743)
- ✅ Flashing border animation with two customizable colors (default: #F5CE17 ↔ #FFFF00)
- ✅ Semi-transparent black background overlay

**Usage:** FlashModal is now used for ALL text-only audience interactions, replacing the previous TextModal. This provides a consistent, visually appealing experience with customizable styling.

**Settings Integration:**
- `flashMessageTimeout` - Timeout in seconds
- `flashMessageBackgroundColor` - Rectangle background color
- `flashMessageBorderColor` - Rectangle border color
- `flashMessageAnimationColor1` - First flashing color
- `flashMessageAnimationColor2` - Second flashing color

### PopupModal (`src/components/modals/PopupModal.tsx`)

**Features:**
- ✅ Supports both text and image content
- ✅ Images fill the entire page
- ✅ User interaction required to close (click or keyboard shortcut)
- ✅ Shows close hint: "Click image/text or press [KEY] to close"
- ✅ Always responds to Escape key
- ✅ Semi-transparent black background overlay

**Usage:**
- Text popups: Display centered text with close instructions
- Image popups: Full-screen image with overlay close hint

### AnimatedModal (`src/components/modals/AnimatedModal.tsx`)

**Enhanced for Video Messages:**
- ✅ GIF takes up 75% of the page (was 90%, now updated to 75%)
- ✅ Auto-closes when audio finishes
- ✅ Fallback timeout of 3.5 seconds if no audio or audio fails
- ✅ Semi-transparent black background overlay

## Settings Configuration

New settings have been added to `src/data/settings.json`:

```json
{
  "section": "Audience Interactions",
  "Label": "Flash Message Timeout (seconds)",
  "id": "flashMessageTimeout",
  "description": "How long flash messages are displayed before automatically closing",
  "type": "number",
  "default": 5
},
{
  "section": "Audience Interactions",
  "Label": "Flash Message Background Color",
  "id": "flashMessageBackgroundColor",
  "description": "Background color for the flash message rectangle",
  "type": "colorpicker",
  "default": "#F5F0B9"
},
{
  "section": "Audience Interactions",
  "Label": "Flash Message Border Color",
  "id": "flashMessageBorderColor",
  "description": "Border color for the flash message rectangle",
  "type": "colorpicker",
  "default": "#307743"
},
{
  "section": "Audience Interactions",
  "Label": "Flash Message Animation Color 1",
  "id": "flashMessageAnimationColor1",
  "description": "First color for the flashing border animation",
  "type": "colorpicker",
  "default": "#F5CE17"
},
{
  "section": "Audience Interactions",
  "Label": "Flash Message Animation Color 2",
  "id": "flashMessageAnimationColor2",
  "description": "Second color for the flashing border animation",
  "type": "colorpicker",
  "default": "#FFFF00"
}
```

## Audience Interaction Data

New interactions have been added to `src/data/audienceInteractions.json`:

```json
{
  "id": "flash",
  "type": "flash",
  "content": {"text": "FLASH MESSAGE!"},
  "icon": {"emoji": "⚡"},
  "shortcuts": ["f", "7"]
},
{
  "id": "popup-text",
  "type": "popup",
  "content": {"text": "Click to close this popup message!"},
  "icon": {"emoji": "💬"},
  "shortcuts": ["p", "8"]
},
{
  "id": "popup-image",
  "type": "popup",
  "content": {"img": "/images/audience-interactions/battle.jpg"},
  "icon": {"emoji": "🖼️"},
  "shortcuts": ["i", "9"]
}
```

## Integration

### AudienceInteractionModalManager

The `AudienceInteractionModalManager` has been enhanced to:

1. **Auto-detect interaction types** based on the `type` field or `id`
2. **Load settings** from localStorage for flash message customization
3. **Route interactions** to the appropriate modal component
4. **Provide global access** via `window.showAudienceInteraction()`
5. **Use FlashModal for all text interactions** - TextModal has been removed and replaced

### AudienceInteractionButtons

Updated to use the global `showAudienceInteraction()` function for consistency across all interaction types. Local TextModal handling has been removed in favor of the centralized system.

## Audience Interaction Types

All audience interactions are now properly typed:

- **Flash interactions** (`type: "flash"`): Applause, Boo, Drink, Welcome Card, Winner
- **Popup interactions** (`type: "popup"`): Text popups, Image popups, Battle "To The Death"
- **Video interactions** (with img + audio): Order 66 execution

## Usage Examples

### Flash Message (Default for Text)
```javascript
// All text-only interactions now use FlashModal automatically
showAudienceInteraction({
  type: 'flash', // or will auto-detect from text-only content
  content: { text: 'Winner!' },
  description: 'Flash notification'
});
```

### Popup Message (Text)
```javascript
// Trigger a text popup
showAudienceInteraction({
  type: 'popup',
  content: { text: 'Click anywhere to close' },
  shortcuts: ['x'],
  description: 'Text popup'
});
```

### Popup Message (Image)
```javascript
// Trigger an image popup
showAudienceInteraction({
  type: 'popup',
  content: { img: '/path/to/image.jpg' },
  shortcuts: ['escape'],
  description: 'Image popup'
});
```

### Video Message
```javascript
// Trigger a video message (existing AnimatedModal)
showAudienceInteraction({
  content: {
    img: '/path/to/animation.gif',
    audio: '/path/to/sound.mp3'
  },
  description: 'Video message'
});
```

## Technical Details

### CSS Architecture
- All modals use consistent z-index layering (9999 for overlay, 10000+ for UI elements)
- Responsive design with mobile-first approach
- CSS custom properties for dynamic styling
- Smooth animations and transitions

### Accessibility
- Keyboard navigation support
- Screen reader friendly elements
- Proper ARIA attributes
- High contrast support

### Performance
- Efficient state management
- Cleanup on component unmount
- Asset optimization
- Minimal re-renders

## Testing

To test the audience interactions:

1. **Start the development server**: `npm start`
2. **Navigate to any page** with audience interaction buttons
3. **Use keyboard shortcuts**:
   - `F` or `7` - Flash message
   - `P` or `8` - Text popup
   - `I` or `9` - Image popup
   - Existing shortcuts for video messages
4. **Test settings** in the Settings page under "Audience Interactions" section
5. **Verify customization** by changing colors and timeouts

## Requirements Compliance

✅ **Flash Message Requirements:**
- Timeout configurable via settings
- Clicking does not disable timeout
- Countdown at top right with circular progress
- Text centered in rectangle
- Customizable colors and borders
- Flashing border animation
- Semi-transparent black background

✅ **Popup Message Requirements:**
- Supports text and image content
- Images fill entire page
- Close hint with keyboard shortcut info
- Requires user interaction to close
- Semi-transparent black background

✅ **Video Message Requirements:**
- GIF takes up 75% of page
- Auto-closes when audio finishes
- Fallback timeout of 3.5 seconds
- Semi-transparent black background

All audience interaction requirements have been successfully implemented and integrated into the existing application architecture.
