# Template System

## Overview

The template system has been simplified from multiple templates per post type to just 4 base templates that can be customized with different text content for any post type.

## Base Templates

### 1. Modern

- Clean, minimalist design
- Gradient background with accent elements
- Right-aligned text layout
- Perfect for contemporary real estate marketing

### 2. Classic

- Traditional real estate style
- Includes property details (beds, baths, sqft)
- Supports brokerage logo and realtor picture
- Professional and trustworthy appearance

### 3. Bold

- High contrast, dramatic styling
- Dark background with strong accent colors
- Centered text layout
- Eye-catching and memorable

### 4. Elegant

- Sophisticated, premium feel
- Diagonal gradient background
- Refined typography and spacing
- Luxury real estate aesthetic

## Customization

Each template can be customized with:

- **Main Heading**: Override the default post type text (e.g., "Just Listed", "Just Sold")
- **Sub Heading**: Add additional text below the main heading
- **Primary Color**: Customize the accent colors throughout the template
- **Post Type**: Choose from 6 different post types:
  - Just Listed
  - Just Sold
  - Just Rented
  - Open House
  - Under Contract
  - Back on Market

## Usage

Templates are now independent of post type, meaning you can use any template with any post type. The system automatically:

1. Applies the selected template design
2. Uses custom text if provided, otherwise falls back to default post type labels
3. Maintains consistent styling across all post types
4. Allows for easy template switching without losing customizations

## Benefits

- **Simplified Management**: Only 4 templates to maintain instead of 6+ per post type
- **Flexible Customization**: Mix and match any template with any post type
- **Consistent Experience**: All templates follow the same design principles
- **Easy Updates**: Template changes automatically apply to all post types
- **Better UX**: Users can experiment with different looks for the same content

## Technical Implementation

- Templates are located in `components/templates/base-templates/`
- Each template accepts a `customText` prop for text customization
- The `TemplateRenderer` component handles template selection and rendering
- Templates use Skia for high-quality graphics and text rendering
- All templates support responsive design and custom color schemes
