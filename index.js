const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';
let requestCount = 0;

app.use(express.json());

const MAX_CACHE_SIZE = 10;
const cache = new Map();

const enforceLRU = () => {
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
            cache.delete(oldestKey);
        }
    }
};

app.use((req, res, next) => {
    requestCount++;
    next();
});

app.post('/cache', (req, res) => {
    const { key, value } = req.body;
    
    if (typeof key !== 'string' || key.trim() === '' || value === undefined) {
        return res.status(400).json({ error: 'Cache entry must include a non-empty string key and a value.' });
    }
    
    if (!cache.has(key) && cache.size >= MAX_CACHE_SIZE) {
        enforceLRU();
    }
    
    cache.set(key, value);
    res.json({ message: cache.has(key) ? 'Cache entry updated successfully.' : 'Cache entry stored successfully.', key, value });
});

app.get('/cache/:key', (req, res) => {
    const { key } = req.params;
    
    if (cache.has(key)) {
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return res.json({ key, value });
    }
    
    res.status(404).json({ error: `Cache entry with key '${key}' not found.` });
});

app.delete('/cache/:key', (req, res) => {
    const { key } = req.params;
    
    if (cache.has(key)) {
        cache.delete(key);
        return res.json({ message: `Cache entry with key '${key}' deleted successfully.`, key });
    }
    
    res.status(404).json({ error: `Cache entry with key '${key}' not found.` });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is live at http://localhost:${PORT} in ${ENV} mode. Total requests served: ${requestCount}`);
});
