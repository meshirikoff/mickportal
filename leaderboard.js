// High Score Leaderboard System
// Stores high scores in localStorage and provides global leaderboard functionality

class Leaderboard {
    constructor() {
        this.storageKey = 'mickportal_leaderboard';
        this.maxScores = 10; // Top 10 scores per game
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        const stored = localStorage.getItem(this.storageKey);
        this.data = stored ? JSON.parse(stored) : {
            mickBlock: [],
            mickPong: [],
            mickBand: []
        };
    }

    saveLeaderboard() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    addScore(gameName, playerName, score, level = null) {
        if (!this.data[gameName]) {
            this.data[gameName] = [];
        }

        const entry = {
            name: playerName || 'Anonymous',
            score: score,
            level: level,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.data[gameName].push(entry);
        this.data[gameName].sort((a, b) => b.score - a.score);
        this.data[gameName] = this.data[gameName].slice(0, this.maxScores);

        this.saveLeaderboard();
        return this.data[gameName];
    }

    getScores(gameName) {
        return this.data[gameName] || [];
    }

    getTopScore(gameName) {
        const scores = this.getScores(gameName);
        return scores.length > 0 ? scores[0] : null;
    }

    getAllScores() {
        return this.data;
    }

    clearScores(gameName) {
        if (this.data[gameName]) {
            this.data[gameName] = [];
            this.saveLeaderboard();
        }
    }

    clearAll() {
        this.data = { mickBlock: [], mickPong: [], mickBand: [] };
        this.saveLeaderboard();
    }

    exportAsJSON() {
        return JSON.stringify(this.data, null, 2);
    }
}

// Create global instance
const leaderboard = new Leaderboard();
