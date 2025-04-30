# GenUI Ecommerce
An LLM-powered ecommerce platform demonstration built on LangChain's [gen-ui-python](https://github.com/bracesproul/gen-ui-python) example. This project demonstrates how Large Language Models can dynamically generate/populate and control UI components based on user conversation in realtime.

## What This Does
This application shows how an AI assistant can drive the user interface in an ecommerce setting:
- The LLM chooses which UI components to display based on the conversation
- Products can be shown as individual details, side-by-side comparisons, or grid layouts
- The interface adapts in real-time as the conversation progresses

## Architecture

<img src="https://github.com/bracesproul/gen-ui-python/blob/main/frontend/public/gen_ui_diagram.png" width=800>

- **Backend**: Python with LangChain/LangGraph/LangServe
  - Handles AI decision-making
  - Defines tools for product manipulation
  - Manages product data and user profiles

- **Frontend**: Next.js
  - Renders components selected by the AI
  - Manages real-time updates via streaming
  - Handles product visualization

## AI Shopping Assistant Persona

The application includes a customizable shopping assistant persona that guides users through their shopping experience. The assistant:

- Provides personalized product recommendations based on user needs
- Explains product features in terms of benefits rather than just listing specs
- Asks clarifying questions to understand user preferences
- Uses conversational tone while maintaining product expertise
- References user profile information to personalize recommendations

The assistant's behavior is controlled through system prompts in the `config.py` file, allowing you to adjust its personality, knowledge level, and interaction style.

## Getting Started

### Backend Setup
```bash
cd backend
poetry install
cp .env.example .env  # Add your API keys
```

Required environment variables:
- `OPENAI_API_KEY`

Optional but recommended:
- LangSmith key for debugging

### Frontend Setup
```bash
cd frontend
yarn install
```

### Running the Application

Backend:
```bash
cd backend
poetry run start
```

Frontend:
```bash
cd frontend
yarn dev
```

Visit `http://localhost:3000` to use the application.

## How It Works

1. User sends a message about products
2. LLM processes the request and decides which component to show
3. The appropriate UI component (details, comparison, or grid) is loaded or a plain text response is presented
4. Product data is fetched and displayed in the chosen format
5. AI provides contextual explanation alongside the visuals

## Key Components

### Backend Tools
- `product-details`: Shows a single product with full specifications
- `product-comparison`: Displays two products side-by-side for comparison
- `product-tiles`: Presents multiple products in a grid layout

### Frontend Components
- `ProductDetail`: Comprehensive view of a single product
- `Comparison`: Side-by-side product comparison with feature highlights
- `ProductTiles`: Grid layout of multiple product options

## Customizing the Application

### Adding Your Own Products

1. Create a new product catalog CSV in the appropriate format:
   ```
   /backend/[product_type]/catalog.csv
   ```
   
   The CSV should include fields like `product_id`, `name`, `brand`, `price`, and any specifications relevant to your product category.

2. Add product images to:
   ```
   /backend/[product_type]/images/[product_id].jpg
   ```

3. (Optional) Add detailed marketing content for each product:
   ```
   /backend/[product_type]/knowledge/[product_id].txt
   ```

### Customizing the Shopping Assistant

The assistant's personality and behavior can be customized through the system prompts in `config.py`:

1. Edit `SYSTEM_PROMPT_TEMPLATE` to change how the assistant selects and uses tools
2. Modify `FINAL_RESPONSE_SYSTEM_PROMPT_TEMPLATE` to adjust how it responds after showing products
3. Update the user profile in `/backend/user_profiles/default.txt` to change background information the assistant uses

### Configuration

The main configuration is in `/backend/gen_ui_backend/config.py`. Key settings include:
- `DEFAULT_PRODUCT_TYPE`: The default product category (e.g., "laptops")
- `SYSTEM_PROMPT_TEMPLATE`: Controls the AI's behavior and how it uses tools
- `FINAL_RESPONSE_SYSTEM_PROMPT_TEMPLATE`: Defines how the AI responds after showing products

You can also modify the frontend display configuration in:
```
/frontend/components/prebuilt/config/[product_type].ts
```

This defines which fields are displayed in different views and how they're formatted.

## Acknowledgments

This project is a fork of [gen-ui-python](https://github.com/bracesproul/gen-ui-python) by [Brace Sproul](https://github.com/bracesproul), extended to demonstrate Generative UI in an ecommerce context.
