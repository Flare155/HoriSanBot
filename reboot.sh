git pull # Pulls the new changes
docker-compose down --rmi all # Closes and deletes the old container
docker-compose up --build -d # Build the new container
docker compose logs --follow # Follow the console output of the bot instance