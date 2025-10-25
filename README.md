# 🥗 NutriCare++ - Smart Health and Nutrition Companion

A comprehensive full-stack health and nutrition application that combines AI-powered nutrition guidance with social features and professional consultation. Built with modern web technologies, NutriCare++ serves as your smart companion for nutrition tracking, connecting with nutritionists, and engaging with a health-focused community.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)

## ✨ Features

### 🤖 AI-Powered Nutrition Assistant
- Multi-language AI chatbot (English, Hindi, Urdu, Punjabi, Marathi, Gujarati)
- Context-aware nutrition advice using OpenAI GPT-4
- Personalized meal recommendations and dietary guidance

### 📊 Health & Nutrition Tracking
- Comprehensive meal and food logging
- Calorie counting and nutritional analysis
- Weight, BMI, and hydration monitoring
- Progress tracking with data visualization using Recharts

### 👥 Social Features
- Instagram-like community feed
- Posts, likes, comments, and friend system
- Share your health journey with the community
- Real-time messaging and chat system

### 💼 Professional Consultation
- Appointment booking with certified nutritionists
- Nutritionist panel for managing consultations
- Direct messaging with nutrition professionals

### 🎨 Modern UI/UX
- Responsive mobile-first design
- Light and dark mode support
- Green and white themed interface
- Floating action menus for easy navigation
- Built with Shadcn/ui and Radix UI components

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Icons**: Font Awesome & Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (ES Modules)
- **Authentication**: Passport.js with Replit Auth (OIDC)
- **Session Management**: Express Sessions with PostgreSQL store

### Database
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit

### External Services
- **AI**: OpenAI GPT-4o
- **Authentication**: Replit Auth
- **Database Hosting**: Neon PostgreSQL
- **Email**: Nodemailer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (or Neon account)
- **OpenAI API key** (for AI features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/KASAKBATRA/Nutrition.git
cd Nutrition
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:port/dbname
SESSION_SECRET=super-secret-session-key
JWT_SECRET=super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
NUTRITIONIX_APP_ID=your-nutritionix-app-id
NUTRITIONIX_API_KEY=your-nutritionix-api-key
FRONTEND_URL=http://localhost:5173
PORT=3000
HOST=0.0.0.0
```

### 4. Database Setup

Push the database schema to your PostgreSQL database:

```bash
npm run db:push
```

### 5. Run the Application

#### Development Mode

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

#### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📁 Project Structure

```
Nutrition/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable React components
│       ├── pages/         # Page components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       └── lib/           # Utility functions
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── db.ts              # Database configuration
│   ├── auth.ts            # Authentication logic
│   ├── openai.ts          # OpenAI integration
│   └── email.ts           # Email service
├── shared/                 # Shared types and utilities
├── scripts/                # Utility scripts
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── drizzle.config.ts      # Drizzle ORM configuration
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:push` | Push database schema to PostgreSQL |
| `npm run check` | Run TypeScript type checking |

## 🚢 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deploy Options

- **Vercel**: `vercel --prod`
- **Railway**: `railway up`
- **Docker**: `docker build -t nutricare-app .`

### Pre-Deployment Checklist

- [ ] Database setup (Neon, Railway, or PostgreSQL)
- [ ] Environment variables configured
- [ ] OpenAI API key obtained
- [ ] Email configuration (Gmail App Password)
- [ ] Successful build test (`npm run build`)
- [ ] Test production build locally

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` |
| `SESSION_SECRET` | Secret for session encryption | `random-secret-string` |
| `EMAIL_USER` | Email account for notifications | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | `app-specific-password` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |
| `PORT` | Server port | `3000` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NUTRITIONIX_APP_ID` | Nutritionix API app ID |
| `NUTRITIONIX_API_KEY` | Nutritionix API key |
| `NODE_ENV` | Environment (development/production) |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [Express](https://expressjs.com/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- AI powered by [OpenAI](https://openai.com/)
- Database hosted on [Neon](https://neon.tech/)

## 📧 Support

For support, email the maintainers or open an issue in the GitHub repository.

## 🌟 Features Roadmap

- [ ] Mobile app (React Native)
- [ ] Recipe sharing and meal planning
- [ ] Integration with fitness trackers
- [ ] Advanced analytics and insights
- [ ] Gamification features

---

**Made with ❤️ for a healthier tomorrow**
