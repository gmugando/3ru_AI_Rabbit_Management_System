# 3RU AI Rabbit Management System

A comprehensive rabbit management system built with Vue.js and Supabase, featuring AI-powered insights and financial management capabilities.

## For Learning Purposes

## Features

### Financial Management
- Real-time financial tracking and analytics
- Revenue and expense monitoring
- Transaction history and categorization
- Financial performance metrics
- Expense breakdown by categories
- Pending payments tracking
- Interactive financial charts and graphs

### User Interface
- Modern, responsive design
- Intuitive navigation
- Real-time data updates
- Interactive charts and visualizations
- Mobile-friendly layout

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/gmugando/3ru_AI_Rabbit_Management_System.git
cd 3ru_AI_Rabbit_Management_System
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
three_ru_vue/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable components
│   ├── views/           # Page components
│   │   └── finance/     # Financial management views
│   ├── router/          # Vue Router configuration
│   ├── store/           # Vuex store
│   └── supabase/        # Supabase configuration
├── public/              # Public assets
└── doc/                 # Documentation (gitignored)
```

## Technology Stack

- **Frontend Framework**: Vue.js 3
- **State Management**: Vuex
- **Routing**: Vue Router
- **UI Components**: PrimeVue
- **Charts**: Chart.js
- **Backend/Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: CSS/SCSS

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

- Follow Vue.js style guide
- Use ESLint for code linting
- Use Prettier for code formatting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- Vue.js team for the amazing framework
- Supabase team for the backend infrastructure
- PrimeVue for the UI components
- Chart.js for the visualization capabilities
