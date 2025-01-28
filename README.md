## SNPsniper leverages state-of-the-art computational methods to predict, compare, and visualize structural changes in RNA sequences, offering comprehensive insights for research and analysis.



## Starting the application locally

The application can be started in two ways:

### Basic version (without phpMyAdmin)

```
docker-compose -f docker-compose.yml up --build
```

### Full version (with phpMyAdmin at the path /pma)

```
docker-compose up --build
```

## Database

```
http://localhost:8081

```

## Backend

```
http://localhost:8080

```

### Test connection to the database

```
http://127.0.0.1:8080/test-db

```

### Test adding a row

```
http://localhost:8080/add-analysis-result?normalSequence=AGTC&wildSequence=TGCA&result=positive%22

```

### Test displaying elements from the database

```
http://localhost:8080/analysis-results

```

## Frontend

```
http://localhost:3000

```
