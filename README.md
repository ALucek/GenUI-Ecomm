# GenUI Product Showcase

A modular generative UI product showcase system that allows you to create interactive, AI-powered shopping experiences for any product type.

## Overview

This application uses a generative UI approach to create an interactive product shopping experience. The system is built to be modular, allowing you to easily switch between different product types by changing a simple configuration.

The application consists of:
- A backend built with LangChain and LangGraph for orchestrating the AI agent
- A frontend built with Next.js for displaying the UI components
- A modular product system that can be configured for different product types

## Setup

1. Clone this repository
2. Install dependencies for both frontend and backend
3. Configure your product type (laptops provided by default)
4. Run the backend and frontend servers

### Backend Setup

```bash
cd backend
pip install -e .
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Configuration

The system is designed to work with different product types. By default, it uses laptops, but you can change this by:

1. Setting the `GENUI_PRODUCT_TYPE` environment variable to your product type name
2. Creating a product folder with the same structure as the `laptops` folder

### Product Folder Structure

Each product type should have its own folder under the `backend` directory:

```
backend/
  ├── your_product_type/
  │   ├── catalog.csv      # Product catalog with attributes
  │   ├── images/          # Product images (named by product_id)
  │   └── knowledge/       # Optional product knowledge files
```

### Catalog File Format

The catalog.csv file should contain product information with at least the following columns:
- `product_id` (required): Unique identifier for the product
- Other attributes: Any attributes relevant to your product type

### Image Files

Each product should have a corresponding image file in the `images` directory:
- File format: JPG
- Filename: `<product_id>.jpg` (e.g., `1.jpg`)
- Images are served through a dynamic API endpoint: `/api/product-images/<product_type>/<product_id>`

## Running the Application

### Backend
```bash
cd backend
export GENUI_PRODUCT_TYPE=your_product_type  # Optional, defaults to "laptops"
python -m gen_ui_backend.server
```

### Frontend
```bash
cd frontend
npm run dev
```

## Adding a New Product Type

To add a new product type:

1. Create a new folder in the `backend` directory with the name of your product type
2. Create a `catalog.csv` file with your product data
3. Add product images to the `images` folder (named by product_id)
4. Set the `GENUI_PRODUCT_TYPE` environment variable to your product type name
5. Start the application

## Customizing UI Components

The frontend components (`Laptop`, `ProductComparison`, `ProductTiles`) are currently named after the default laptop product type. For a fully customized experience, you may want to:

1. Create new components specific to your product type
2. Update the `TOOL_COMPONENT_MAP` in `frontend/app/agent.tsx` to use your components

## License

[MIT](LICENSE)
