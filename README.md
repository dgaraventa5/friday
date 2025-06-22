# Friday - Low-Stress Task Manager

<p align="center">
  <img src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-vector%2Ftree-of-life&psig=AOvVaw28lNLx3kxsyOQ-l8Jln7Pf&ust=1750637038084000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMiI-avdg44DFQAAAAAdAAAAABAE" alt="Friday App Logo" width="200" height="200">
</p>

Friday is a focused to-do list app designed for busy professionals and neurodivergent users seeking a low-stress way to manage daily priorities. The app leverages the Eisenhower Matrix and simple category-based limits to surface no more than four essential tasks per day, reducing cognitive load and helping users achieve well-rounded, intentional productivity.

## ✨ Features

- **Intelligent Task Prioritization**: Automatically surfaces your top 4 tasks each day based on importance, urgency, and due dates
- **Category Management**: Balance your life by setting limits for different categories (Work, Home, Health, etc.)
- **Quick Task Input**: Add, edit, and delete tasks with minimal steps
- **Recurring Tasks**: Create tasks that repeat on chosen intervals
- **Clean, Distraction-Free UI**: Focus on what matters with a minimalist interface
- **Google Authentication**: Secure and easy login

## 📱 Live Demo

*Coming soon!* The app will be deployed to Firebase Hosting.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase project with Google Authentication enabled

### Installation

1. Clone the repository
   ```
   git clone https://github.com/dgaraventa5/friday.git
   cd friday-bolt
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the project root with your Firebase configuration
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```
npm run build
```

## 🔧 Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Firebase** - Authentication and data storage
- **Tailwind CSS** - Styling

## 🧠 Philosophy

Friday is built on the principle that **less is more** when it comes to task management. By showing only your top 4 tasks each day, the app helps you:

- Focus on what truly matters
- Reduce decision fatigue
- Maintain balance across different life areas
- Feel accomplished rather than overwhelmed

## 🔒 Security & Privacy

- Authentication handled securely through Firebase
- User data is never sold or shared
- Environment variables keep API keys and secrets secure

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/dgaraventa5/friday](https://github.com/dgaraventa5/friday)

---

<p align="center">
  Made with ❤️ for a less stressful life
</p> 