# Chay container

docker compose up -d

# Stop + remove container

docker compose down

# Stop container + xoa luôn data (nguy hiểm)

docker compose down -v

# Vào psql

docker exec -it vdev-postgres psql -U postgres -d renluyen_dlu

# Connection String

postgresql://USER:PASSWORD@HOST:PORT/DATABASE

postgresql://postgres:postgres@localhost:5435/renluyen_dlu
