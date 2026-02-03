# Dynasty API

A real-time sports match tracking API built with Bun, Express, and WebSockets. Dynasty provides live match commentary, real-time updates, and comprehensive match management with bot protection and rate limiting.

## 🚀 Features

- **Match Management**: Create, update, and track sports matches
- **Real-time Commentary**: Live match commentary with WebSocket support
- **Match Status Tracking**: Automatic status updates (scheduled, live, finished)
- **Real-time Subscriptions**: Subscribe to specific match updates via WebSockets
- **Bot Protection**: Integrated Arcjet security with bot detection and rate limiting
- **Type-safe Database**: Drizzle ORM with PostgreSQL and automatic migrations
- **Input Validation**: Comprehensive request validation with Zod schemas

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **WebSockets**: [ws](https://github.com/websockets/ws)
- **Validation**: [Zod](https://github.com/colinhacks/zod)
- **Security**: [Arcjet](https://arcjet.com/)
- **Environment**: [@t3-oss/env-core](https://env.t3.gg/)

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- PostgreSQL database
- Node.js 18+ (for compatibility)

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://www.github.com/undead-reaper/dynasty-api
   cd dynasty-api
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following variables:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/dynasty
   PORT=8080
   HOST=0.0.0.0
   ARCJET_KEY=your_arcjet_key
   ARCJET_ENV=development
   ```

4. **Run database migrations**
   ```bash
   bun run drizzle:migrate
   ```

## 🚀 Running the Application

### Development

```bash
bun run dev
```

### Production

```bash
bun run start
```

### Database Management

```bash
# Generate new migration
bun run drizzle:generate

# Run migrations
bun run drizzle:migrate

# Open Drizzle Studio
bun run drizzle:studio
```

## 📡 API Endpoints

### Matches

- `GET /matches` - List all matches with pagination
- `POST /matches` - Create a new match
- `GET /matches/:id/commentaries` - Get match commentaries
- `POST /matches/:id/commentaries` - Add commentary to a match

### Health Check

- `GET /` - Welcome message
- `GET /ping` - Health check endpoint

## 🔌 WebSocket API

Connect to: `ws://localhost:8080/ws`

### Messages

**Subscribe to match updates:**

```json
{
  "type": "subscribe",
  "matchId": 123
}
```

**Unsubscribe from match updates:**

```json
{
  "type": "unsubscribe",
  "matchId": 123
}
```

### Events

**Welcome message:**

```json
{
  "type": "welcome"
}
```

**Match created:**

```json
{
  "type": "match_created",
  "data": {
    "id": 123,
    "sport": "cricket",
    "homeTeam": "India",
    "awayTeam": "Australia",
    "status": "scheduled",
    "startTime": "2026-02-03T10:00:00Z",
    "endTime": "2026-02-03T18:00:00Z"
  }
}
```

**Commentary added:**

```json
{
  "type": "commentary",
  "data": {
    "id": 456,
    "matchId": 123,
    "minute": 45,
    "message": "Goal scored!",
    "actor": "Player Name",
    "team": "Team Name"
  }
}
```

## 📊 Database Schema

### Matches

- `id` - Primary key
- `sport` - Sport type
- `homeTeam` - Home team name
- `awayTeam` - Away team name
- `status` - Match status (scheduled, live, finished)
- `startTime` - Match start time
- `endTime` - Match end time
- `homeScore` - Home team score
- `awayScore` - Away team score
- `createdAt` - Creation timestamp

### Commentaries

- `id` - Primary key
- `matchId` - Foreign key to matches
- `minute` - Match minute
- `sequence` - Event sequence number
- `period` - Match period
- `eventType` - Type of event
- `actor` - Player/actor name
- `team` - Team name
- `message` - Commentary message
- `metadata` - Additional JSON metadata
- `tags` - Array of tags
- `createdAt` - Creation timestamp

## 🔒 Security Features

- **Rate Limiting**: API endpoints are rate-limited using Arcjet
- **Bot Detection**: Automatic bot detection with configurable allow lists
- **DDoS Protection**: Shield protection against attacks
- **WebSocket Security**: Rate limiting and bot detection for WebSocket connections
- **Input Validation**: All inputs validated with Zod schemas

## 🧪 Testing WebSocket Connection

Using `wscat`:

```bash
# Install wscat globally
npm install -g wscat

# Connect to WebSocket server
wscat -H "User-Agent: Mozilla/5.0" -c ws://localhost:8080/ws

# Subscribe to match updates
> {"type": "subscribe", "matchId": 1}
```

## 📁 Project Structure

```
src/
├── drizzle/
│   ├── schemas/          # Database schemas
│   └── migrations/       # Database migrations
├── env/
│   └── server.ts        # Environment configuration
├── routes/
│   ├── matches.ts       # Match endpoints
│   └── commentaries.ts  # Commentary endpoints
├── utils/
│   └── match-status.ts  # Match status utilities
├── validations/
│   ├── matches.ts       # Match validation schemas
│   └── commentaries.ts  # Commentary validation schemas
├── ws/
│   └── server.ts        # WebSocket server
├── arcjet.ts            # Security configuration
└── index.ts             # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.
