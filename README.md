# dio-restaurant

Este é um projeto simples de um restaurante utilizando uma arquitetura de microsserviços. Exitem 2 APIs (Garçom e App), onde o cliente pode fazer os seus pedidos. Essas APIs enviam o pedido para a cozinha, já separando o que é para o cozinheiro fazer e o que é para o barman fazer. Depois o cozinheiro e o barman enviam o pedido para o balcão, de onde o garçom pega e entrega na mesa, ou para o balcão do delivery, onde os pedidos são separados para serem entregues pelo motoboy.

![dio-restaurant](https://user-images.githubusercontent.com/34447259/91900931-d2c9f100-ec75-11ea-8d6e-c75f66961b8a.jpg)

Os microsserviços são:

- [Garçom]()
- [Cozinha (Para o cozinheiro e barman)]()
- [App]()
- [Motoboy]()

Todos foram feitos em [Node.js](https://nodejs.org/en/), utilizando o [Express](https://expressjs.com/) como servidor. A comunicação entre eles é feita utilizando [Kafka](https://kafka.apache.org/). Também foi utilizado o [Redis](https://redis.io/) para gerenciar os pedidos do [App]().

## Rodando o Projeto com Docker e Docker Compose

Como são várias aplicações, a maneira mais fácil de rodar todas elas é com o [Docker Compose](https://docs.docker.com/compose/).

--docker compose do kafka

--docker compose do redis

--npm install para instalar as dependencias do servico

### Dependências

Antes de começar a instalar e rodar o projeto é necessário instalar algumas dependências:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)



#### Primeira execução

Na primeira vez que subirmos a instância do kafka precisamos criar os tópicos que serão utilizados no projeto. Para isso, primeiro subimos a aplicação:

```bash
docker-compose up -d kafka
docker-compose up -d redis
```


Agora precisamos criar os tópicos que serão usados. Para isso, rodamos os seguintes comandos:

```bash
docker-compose exec kafka kafka-topics --create --topic order --partitions 4 --replication-factor 1 --if-not-exists --zookeeper zookeeper:2181
docker-compose exec kafka kafka-topics --create --topic balcony --partitions 4 --replication-factor 1 --if-not-exists --zookeeper zookeeper:2181
docker-compose exec kafka kafka-topics --create --topic deliveryBalcony --partitions 4 --replication-factor 1 --if-not-exists --zookeeper zookeeper:2181
docker-compose exec kafka kafka-topics --create --topic delivery --partitions 4 --replication-factor 1 --if-not-exists --zookeeper zookeeper:2181
```


#### Utilizando as APIs

A API do [Garçom]() está exposta na url `http://localhost:3000` e a do [App]() na url `http://localhost:4000`.

Exemplo de request para fazer o pedido para o Garçom:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "table": 1, "food": ["food1", "food2"], "drinks": ["drink1", "drink2"] }' \
  http://localhost:3000/order
```

Exemplo de request para fazer o pedido para o App:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "address": "address 1", "food": ["food1", "food2"], "drinks": ["drink1", "drink2"] }' \
  http://localhost:4000/order
```
