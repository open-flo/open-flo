#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default environment variables if not already set
export REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}
export MONGO_DB_CONNECTION_STRING=${MONGO_DB_CONNECTION_STRING:-"mongodb://localhost:27017/trail_blazer"}
export APP_ENV=${APP_ENV:-"development"}
export DEBUG=${DEBUG:-"true"}

# Clean up MongoDB connection string - remove any extra quotes
export MONGO_DB_CONNECTION_STRING=$(echo $MONGO_DB_CONNECTION_STRING | sed 's/^"//;s/"$//')

echo "Environment variables:"
echo "REDIS_URL: $REDIS_URL"
echo "MONGO_DB_CONNECTION_STRING: $MONGO_DB_CONNECTION_STRING"
echo "APP_ENV: $APP_ENV"
echo "DEBUG: $DEBUG"

# Start Redis in the background
echo "Starting Redis server..."
redis-server --daemonize yes

# Wait a moment for Redis to start
sleep 2

# Check if Redis is running
if redis-cli ping | grep -q "PONG"; then
    echo "Redis server started successfully"
else
    echo "Failed to start Redis server"
    exit 1
fi

# Start the Python application
echo "Starting Python application..."
exec python main.py 