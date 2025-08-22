# 🚀 Crypto Jump Game

A high-quality Telegram mini game featuring an animated crypto chart background with a jumping character. Jump over red candles to survive and achieve the highest score!

## 🎮 Game Features

- **Animated Crypto Charts**: Real-time animated candlestick charts with red and green candles
- **Jumping Character**: High-quality crypto trader character with smooth animations
- **Progressive Difficulty**: Chart speed increases as you survive longer
- **Score System**: Earn points for each second survived
- **Leaderboard**: Global leaderboard with PostgreSQL database
- **Telegram Integration**: Full Telegram Web App support
- **Responsive Design**: Works on all devices and screen sizes

## 🎯 How to Play

1. **Start the Game**: Click "Start Game" from the main menu
2. **Jump**: Tap anywhere on the screen to make the character jump
3. **Avoid Red Candles**: Don't touch the red candlestick lines
4. **Survive**: The longer you survive, the higher your score
5. **Compete**: Submit your score to the global leaderboard

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Railway
- **Deployment**: Railway
- **Telegram**: Telegram Web App API
- **Animations**: Canvas API, Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Railway recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abhyudday/Mini-App-Game-for-JustJeet.git
   cd Mini-App-Game-for-JustJeet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your database URL:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   NEXT_PUBLIC_APP_URL=https://your-app-domain.railway.app
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL service**
   ```bash
   railway add
   ```

5. **Set environment variables**
   ```bash
   railway variables set DATABASE_URL=your_postgresql_url
   railway variables set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   railway up
   ```

## 📱 Telegram Bot Setup

1. **Create a bot with @BotFather**
2. **Set up Web App**
3. **Configure the bot to use your deployed URL**
4. **Test the game in Telegram**

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── Character.tsx     # Game character
│   ├── CryptoChart.tsx   # Animated chart
│   ├── Game.tsx          # Main game logic
│   ├── GameUI.tsx        # Game interface
│   └── Leaderboard.tsx   # Leaderboard component
├── lib/                   # Utility functions
│   └── db.ts            # Database utilities
├── types/                 # TypeScript types
│   └── telegram.d.ts    # Telegram Web App types
├── railway.json          # Railway configuration
├── Dockerfile            # Docker configuration
└── package.json          # Dependencies
```

## 🎨 Customization

### Changing Character
Edit `components/Character.tsx` to modify the character appearance and animations.

### Modifying Chart Style
Update `components/CryptoChart.tsx` to change chart colors, animations, and behavior.

### Adjusting Game Difficulty
Modify game constants in `components/Game.tsx`:
- `GRAVITY`: Jump physics
- `JUMP_FORCE`: Jump strength
- `GROUND_Y`: Ground position

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure PostgreSQL service is running
   - Check Railway service status

2. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **Telegram Integration Issues**
   - Verify bot token is correct
   - Check Web App URL configuration
   - Ensure HTTPS is enabled in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Telegram Web App API
- Next.js team for the amazing framework
- Framer Motion for smooth animations
- Railway for seamless deployment

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Abhyudday/Mini-App-Game-for-JustJeet/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

**Made with ❤️ for the crypto community**
