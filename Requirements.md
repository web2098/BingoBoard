# Bingo Board Application Requirements

## Table of Contents
- [Global Navigation Requirements](#global-navigation-requirements)
- [Select Game Page](#select-game-page)
- [Board Page](#board-page)
- [Settings Page](#settings-page)
- [Game Data Structure](#game-data-structure)

## Global Navigation Requirements

### Menu System
- All pages must have a menu button in the top left corner that is 3 horizontally bars (hamburger menu)
- The menu area must have a title "Bingo Menu"
- The menu area must have a version string under the title
- The menu area should have a section for links based on the current page
- The menu area must have a horizontal divider line
- The menu area must have a link to the settings page under the divider line
- The menu area must be accessible from all pages

## Select Game Page

### Layout Structure
The select game page must have 3 sections with responsive layout:
    - **Main Layout**: Fixed vertical off-white sidebar (80px desktop, 60px tablet, 50px mobile) on the left containing all navigation buttons
    - **Section 1**: Game preview area taking 2/3 width (desktop) or full width stacked (mobile) and 60% of viewport height
         - **Game Info Card**: Contains game name and rules with blue left border accent
         - **Free Space Toggle**: Visual toggle switch to alternate between primary and alternative board layouts
         - **Game Display Area**: Shows current selected game variant from data/games.ts with responsive scaling
            - **Single Board**: Square aspect ratio (1:1) that scales with available space
            - **Dual Board**: Two boards with operator text ("AND", "OR", "INTO") between them
            - **Responsive Layout**: Horizontal on desktop, vertical stack on mobile for dual boards
            - **Board Cells**: Equal-sized cells with column headers B-I-N-G-O, center cell shows "FREE"
            - **Highlighting**: Cells specified in variant are highlighted with dark green background
            - **Typography**: Responsive text sizing using clamp() for optimal readability
         - **Variant Controls**: Previous/next arrows with current variant indicator, supports scroll wheel navigation
    - **Section 2**: Welcome area taking 1/3 width (desktop) or full width stacked (mobile) and same height as Section 1
        - **Welcome Message Card**: Displays customizable welcome message with large typography
        - **QR Code Card**: Contains responsive QR code for room joining functionality
        - **Both cards**: Consistent styling with blue left border accent and proper padding
    - **Section 3**: Full width bottom section taking 25% of viewport height with horizontal divider
        - **Swipeable Game Preview**: Horizontal scrolling list of all available games
            - **Preview Boards**: Rectangular aspect ratio (2:1) for space efficiency in carousel
            - **Board Rendering**: Shows first variant, first board with appropriate highlighting
            - **Game Labels**: Improved typography (1.2rem) showing game name with responsive sizing
            - **Responsive Slides**: 4 per view (desktop), 3 (tablet), 2 (mobile) with smooth transitions
        - **Modern Navigation**:
            - **Swiper Arrows**: Redesigned with rounded borders, hover effects, and proper positioning
            - **Pagination Dots**: Interactive dots showing current position with smooth transitions
            - **Touch/Mouse Support**: Full swipe gesture support and scroll wheel integration
            - **Infinite Loop**: Seamless looping through all available games
        - **Game Selection**: Click any preview to update main display with selected game

### Advanced Pattern Features
The select game page must support advanced pattern display and rotation features:
    - **Dynamic Pattern Generation**: Game variants must support multiple pattern variations
        - Patterns must be generated as functions that return arrays of [row, col] coordinate pairs
        - Pattern functions must support preview mode for consistent UI display
        - Pattern functions must handle free space settings (filtering center cell [2,2] when disabled)
        - Multi-pattern games must generate all valid patterns for rotation display
    - **Pattern Rotation System**: Games with multiple patterns must automatically cycle through variations
        - Pattern changes must occur at user-configurable intervals (default: 3 seconds)
        - Pattern rotation must include visual progress indicators with smooth transitions
        - Multi-board games must synchronize pattern changes across all boards
        - Users must be able to manually navigate patterns using variant controls
    - **Advanced Pattern Filtering**: Complex game variants may require custom pattern validation
        - Game variants may include optional filter functions for pattern validation
        - Filters must ensure pattern combinations follow specific game rules
        - Filters must prevent invalid game states (e.g., impossible board combinations)
        - Filtered patterns must be cached for optimal UI performance
    - **Enhanced Free Space Integration**: Games must properly adapt to free space toggle
        - Conditional patterns must change based on free space setting (e.g., Railroad Tracks layout)
        - Positional patterns must generate variations for all valid board positions
        - Preview patterns must remain stable regardless of randomization

### Fixed Navigation Elements
All navigation elements must have proper z-index layering:
    - **Hamburger Menu Button**: Top-left position (z-index: 1001) above all other elements
    - **Start Game Button**: Green circular button with play icon (z-index: 10) positioned below hamburger
    - **Audience Interaction Buttons**: Vertically stacked below start button (z-index: 10) with gradient styling and animations
    - **Menu Overlay**: When hamburger menu opens, overlay appears above all content (z-index: 1000) but below hamburger button

### Responsive Design Features
    - **Sidebar**: Responsive width that adjusts with screen size while maintaining button alignment
    - **Layout Stacking**: Mobile layout reorganizes sections vertically with proper spacing
    - **Typography**: Fluid responsive text sizing throughout all components
    - **Touch Optimization**: All interactive elements properly sized for mobile interaction
    - **Consistent Spacing**: Unified gap and padding system across all breakpoints

## Board Page

### Page Structure
The board page should have 2 sections:

#### Section 1: Header
- The header should have a preview of the current game
- The header should have text with "The last number called is: [NUMBER]"
- Under the text should be smaller text that says "[Called]/[Total] numbers called"
- Under the text should be an optional text that says special callouts for different cells when selected
- The header should then have a section for quick actions
- The header should then have a section for a QR code to join the bingo room

#### Section 2: Bingo Numbers Grid
- The grid should be 5x15
- The grid should have the letters B,I,N,G,O as the label for each row
- Each cell in the grid should have a number between 1 and 75
- Each cell in the grid should be clickable to mark the number as called

## Settings Page

### Page Structure
The settings page should contain collapsible sections with a grouping title:

#### Core Requirements
- Under each section will be all properties with a label, description and UI element to change the property
- Settings sections should support horizontal scrolling when content exceeds container width

#### Navigation Elements
- The settings page should have a single floating action button positioned under the hamburger menu on the left side:
    - A red reset button with a revert icon for resetting to default settings
- The hamburger menu should also provide reset functionality for alternative access

#### Data Management
- Settings should auto-save automatically without user intervention or notifications
- Settings should be defined in json in the format supporting extended types:
    ```json
    {
        "section": "Section Title",
        "Label": "Property Label",
        "id": "property-id",
        "description": "Property Description",
        "type": "text|number|boolean|select|colorpicker|password|combo+textarea|special-numbers",
        "default": "Default Value",
        "options": ["Option 1", "Option 2"] // Only for select type, can be dynamic functions
    }
    ```
- Settings should be defined in a single settings.json file with dynamic section rendering
- Sections should be built from the json data for each unique section value in the property list
- Each section should have properties listed under built from the json data

#### Responsive Design
The settings page should have responsive design:
- Two-column layout (settings + special numbers) on desktop/tablet
- Single-column stacked layout on mobile devices
- Horizontal scrolling with custom scrollbars for overflow content
- The settings page should have a link to the about page via the hamburger menu

#### Special Numbers Section
The Settings page should have a static section for Special numbers:
- The Special numbers section should have a 5x15 grid of the numbers 1-75
- The grid should be visually centered and responsive across all screen sizes
- Under the special numbers grid should be a text area to add custom messages
- When a number is clicked in the special numbers grid the text area should be updated with any registered messages for that number if available
- When a number is clicked any previous number should be unselected
- When a number is clicked the background of the cell should change to indicate it is selected
- There should be a specialNumbers.json file that defines pre-built special numbers that are loaded and overridable by the user
- The special numbers should support both pre-built messages and user customizations
- User customizations should override pre-built messages but fall back gracefully

#### Debug Section
The settings page should have a static Debug section at the bottom of the left column:
- The Debug section should be collapsed by default to keep the interface clean
- The Debug section should display all current settings in formatted JSON
- The Debug section should include metadata like settings count, version, and last modified timestamp
- The Debug section should automatically update when any setting changes
- The Debug section should be implemented as a standalone component, not as part of the settings.json configuration
- The Debug section should have distinctive visual styling (purple accent, wrench icon)
- The Debug section should use a monospace font for better JSON readability
- The Debug section should be responsive and work well on mobile devices

#### Additional Requirements
- All settings controls should use full width in single-column mobile layout
- The page should have proper padding to clear the hamburger menu and maintain visual balance
- Settings should include validation and proper data type handling
- Settings operations should happen silently without notifications or popups

## Game Data Structure

### Requirements
Game data structure must support complex multi-board game logic:

#### Standardized Game Metadata
All game variants must include consistent properties:
- Human-readable rules describing win conditions
- Game duration estimates ("Fast", "Average", "Slow")
- Logical operators for multi-board games ("and", "or", "transition")
- Default free space settings and dynamic support flags

#### Multi-Board Game Support
Dual-board games must handle complex win conditions:
- Games with "OR" operators must ensure only valid pattern combinations are displayed
- Pattern separation must distinguish between different pattern types (single vs double bingo)
- Board synchronization must maintain logical consistency during pattern rotation

#### Performance Requirements
Pattern generation and display must not impact UI responsiveness:
- Pattern caching must prevent regeneration on every render
- Cache invalidation must occur when game variant or settings change
- Complex filtering operations must not block user interactions